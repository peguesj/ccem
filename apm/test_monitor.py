"""Tests for CCEM APM v4 monitor.py -- multi-project support."""
import json
import os
import sys
import tempfile
import pytest

# Ensure monitor is importable
sys.path.insert(0, os.path.dirname(__file__))
import monitor


# ── Fixtures ────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_state():
    """Reset all global state between tests."""
    monitor.AGENTS.clear()
    monitor.TASKS.clear()
    monitor.PLANE_PM.clear()
    monitor.SLASH_COMMANDS.clear()
    monitor.PROJECTS_DATA.clear()
    monitor._notifications.clear()
    saved_cfg = dict(monitor.CFG)
    yield
    monitor.AGENTS.clear()
    monitor.TASKS.clear()
    monitor.PLANE_PM.clear()
    monitor.SLASH_COMMANDS.clear()
    monitor.PROJECTS_DATA.clear()
    monitor._notifications.clear()
    monitor.CFG.update(saved_cfg)


@pytest.fixture
def v4_config(tmp_path):
    """Create a v4 config file and point monitor at it."""
    prd = tmp_path / "prd.json"
    prd.write_text(json.dumps({
        "project": "test-proj",
        "branchName": "main",
        "description": "Test",
        "userStories": [
            {"id": "US-001", "title": "Story 1", "priority": 1, "passes": True},
            {"id": "US-002", "title": "Story 2", "priority": 2, "passes": False},
        ]
    }))
    prd2 = tmp_path / "prd2.json"
    prd2.write_text(json.dumps({
        "project": "other-proj",
        "branchName": "dev",
        "description": "Other",
        "userStories": [
            {"id": "US-010", "title": "Other Story", "priority": 1, "passes": True},
        ]
    }))
    cfg = {
        "version": "4.0.0",
        "port": 3031,
        "active_project": "alpha",
        "projects": [
            {
                "name": "alpha",
                "root": "/tmp/alpha",
                "tasks_dir": str(tmp_path / "alpha_tasks"),
                "prd_json": str(prd),
                "status": "active",
                "sessions": [{"session_id": "s1", "status": "active"}],
            },
            {
                "name": "beta",
                "root": "/tmp/beta",
                "tasks_dir": str(tmp_path / "beta_tasks"),
                "prd_json": str(prd2),
                "status": "active",
                "sessions": [{"session_id": "s2", "status": "active"}],
            },
        ]
    }
    cfg_path = tmp_path / "apm_config.json"
    cfg_path.write_text(json.dumps(cfg))
    old_path = monitor.CONFIG_PATH
    monitor.CONFIG_PATH = str(cfg_path)
    monitor.CFG = monitor.load_config()
    yield cfg, tmp_path
    monitor.CONFIG_PATH = old_path


# ── US-001: v4 Config Loader ───────────────────────────────────────

class TestConfigLoader:
    def test_load_config_returns_dict(self):
        cfg = monitor.load_config()
        assert isinstance(cfg, dict)

    def test_load_config_v4_format(self, v4_config):
        cfg = monitor.load_config()
        assert cfg["version"] == "4.0.0"
        assert "projects" in cfg
        assert isinstance(cfg["projects"], list)
        assert len(cfg["projects"]) == 2

    def test_load_config_missing_file(self, tmp_path):
        monitor.CONFIG_PATH = str(tmp_path / "nonexistent.json")
        cfg = monitor.load_config()
        assert cfg["version"] == "4.0.0"
        assert cfg["projects"] == []
        assert cfg["active_project"] is None

    def test_load_config_v3_compat(self, tmp_path):
        v3 = {"project_name": "legacy", "port": 3031, "tasks_dir": "/tmp/t", "prd_json": "/tmp/p.json"}
        p = tmp_path / "v3.json"
        p.write_text(json.dumps(v3))
        monitor.CONFIG_PATH = str(p)
        cfg = monitor.load_config()
        assert cfg["version"] == "4.0.0"
        assert cfg["active_project"] == "legacy"
        assert len(cfg["projects"]) == 1
        assert cfg["projects"][0]["name"] == "legacy"

    def test_get_project(self, v4_config):
        assert monitor.get_project("alpha") is not None
        assert monitor.get_project("alpha")["name"] == "alpha"
        assert monitor.get_project("nonexistent") is None

    def test_get_active_project(self, v4_config):
        active = monitor.get_active_project()
        assert active is not None
        assert active["name"] == "alpha"

    def test_reload_config(self, v4_config):
        cfg, tmp_path = v4_config
        monitor.reload_config()
        assert monitor.CFG["active_project"] == "alpha"


# ── US-002: Per-Project Data Isolation ─────────────────────────────

class TestProjectDataIsolation:
    def test_ensure_project_data_creates_namespace(self):
        data = monitor.ensure_project_data("proj1")
        assert "agents" in data
        assert "tasks" in data
        assert "notifications" in data
        assert isinstance(data["agents"], dict)

    def test_ensure_project_data_idempotent(self):
        d1 = monitor.ensure_project_data("proj1")
        d1["agents"]["a1"] = {"name": "test"}
        d2 = monitor.ensure_project_data("proj1")
        assert "a1" in d2["agents"]

    def test_ensure_project_data_multiple_projects(self):
        monitor.ensure_project_data("p1")
        monitor.ensure_project_data("p2")
        assert "p1" in monitor.PROJECTS_DATA
        assert "p2" in monitor.PROJECTS_DATA
        assert monitor.PROJECTS_DATA["p1"] is not monitor.PROJECTS_DATA["p2"]

    def test_resolve_project_explicit(self, v4_config):
        assert monitor._resolve_project("beta") == "beta"

    def test_resolve_project_active_fallback(self, v4_config):
        assert monitor._resolve_project(None) == "alpha"

    def test_resolve_project_default_fallback(self):
        monitor.CFG = {"active_project": None, "projects": []}
        assert monitor._resolve_project(None) == "default"

    def test_register_agent_with_project(self, v4_config):
        monitor.register_agent("a1", name="Agent 1", project_name="alpha")
        monitor.register_agent("a2", name="Agent 2", project_name="beta")
        alpha_data = monitor.ensure_project_data("alpha")
        beta_data = monitor.ensure_project_data("beta")
        assert "a1" in alpha_data["agents"]
        assert "a2" not in alpha_data["agents"]
        assert "a2" in beta_data["agents"]

    def test_register_agent_backward_compat(self, v4_config):
        monitor.register_agent("a1", name="Agent 1", project_name="alpha")
        assert "a1" in monitor.AGENTS

    def test_register_agent_same_id_different_projects(self, v4_config):
        monitor.register_agent("shared", name="Alpha Ver", project_name="alpha")
        monitor.register_agent("shared", name="Beta Ver", project_name="beta")
        alpha_data = monitor.ensure_project_data("alpha")
        beta_data = monitor.ensure_project_data("beta")
        assert alpha_data["agents"]["shared"]["name"] == "Alpha Ver"
        assert beta_data["agents"]["shared"]["name"] == "Beta Ver"

    def test_discover_agents_with_project(self, v4_config):
        cfg, tmp_path = v4_config
        tasks = tmp_path / "alpha_tasks"
        tasks.mkdir()
        (tasks / "agent-x.output").write_text("")
        (tasks / "agent-y.output").write_text("")
        found = monitor.discover_agents(tasks_dir=str(tasks), project_name="alpha")
        assert len(found) == 2
        alpha_data = monitor.ensure_project_data("alpha")
        assert "agent-x" in alpha_data["agents"]

    def test_discover_agents_isolated(self, v4_config):
        cfg, tmp_path = v4_config
        at = tmp_path / "alpha_tasks"
        at.mkdir()
        (at / "a1.output").write_text("")
        bt = tmp_path / "beta_tasks"
        bt.mkdir()
        (bt / "b1.output").write_text("")
        monitor.discover_agents(tasks_dir=str(at), project_name="alpha")
        monitor.discover_agents(tasks_dir=str(bt), project_name="beta")
        alpha_data = monitor.ensure_project_data("alpha")
        beta_data = monitor.ensure_project_data("beta")
        assert "a1" in alpha_data["agents"]
        assert "a1" not in beta_data["agents"]
        assert "b1" in beta_data["agents"]

    def test_get_ralph_data_per_project(self, v4_config):
        ralph_alpha = monitor.get_ralph_data(project_name="alpha")
        ralph_beta = monitor.get_ralph_data(project_name="beta")
        assert ralph_alpha is not None
        assert ralph_alpha["project"] == "test-proj"
        assert ralph_beta is not None
        assert ralph_beta["project"] == "other-proj"

    def test_get_api_data_with_project(self, v4_config):
        monitor.register_agent("a1", name="Agent 1", project_name="alpha")
        data = monitor.get_api_data(project_name="alpha")
        assert data["project"] == "alpha"
        agent_ids = [a["id"] for a in data["agents"]]
        assert "a1" in agent_ids

    def test_get_api_data_default_uses_active(self, v4_config):
        monitor.register_agent("a1", name="Agent 1", project_name="alpha")
        data = monitor.get_api_data()
        assert data["project"] == "alpha"


# ── US-003: Project-Scoped API Routes ──────────────────────────────

class TestProjectRoutes:
    def test_parse_path_plain(self):
        handler = _make_handler("/api/data")
        path, qs, proj = handler._parse_path()
        assert path == "/api/data"
        assert proj is None

    def test_parse_path_project_scoped(self):
        handler = _make_handler("/project/viki/api/data")
        path, qs, proj = handler._parse_path()
        assert path == "/api/data"
        assert proj == "viki"

    def test_parse_path_project_root(self):
        handler = _make_handler("/project/viki/")
        path, qs, proj = handler._parse_path()
        assert path == "/"
        assert proj == "viki"

    def test_parse_path_query_param(self):
        handler = _make_handler("/api/data?project=beta")
        path, qs, proj = handler._parse_path()
        assert path == "/api/data"
        assert proj == "beta"


# ── US-004/005: Landing Page & Project Dashboard ───────────────────

class TestLandingPage:
    def test_build_landing_html(self, v4_config):
        html = monitor._build_landing_html()
        assert "CCEM APM v4" in html
        assert "alpha" in html
        assert "beta" in html
        assert "/project/alpha/" in html
        assert "/project/beta/" in html

    def test_landing_includes_active_marker(self, v4_config):
        html = monitor._build_landing_html()
        assert "active project" in html


# ── US-006: Health Endpoint ────────────────────────────────────────

class TestHealth:
    def test_get_ralph_flowchart_data(self, v4_config):
        data = monitor.get_ralph_flowchart_data(project_name="alpha")
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) == 2
        assert data["nodes"][0]["status"] == "passed"
        assert data["nodes"][1]["status"] == "failed"

    def test_get_ralph_flowchart_no_prd(self):
        data = monitor.get_ralph_flowchart_data(project_name="nonexistent")
        assert data["nodes"] == []


# ── Notification System ────────────────────────────────────────────

class TestNotifications:
    def test_add_notification(self):
        nid = monitor.add_notification("Test", "Body", category="info")
        assert isinstance(nid, int)
        assert len(monitor._notifications) == 1

    def test_notifications_capped(self):
        for i in range(210):
            monitor.add_notification(f"N{i}", "body")
        assert len(monitor._notifications) == 200


# ── Helper to create mock handler ──────────────────────────────────

class _MockHandler(monitor.MonitorHandler):
    def __init__(self, path):
        self.path = path
        self.headers = {}

    def _parse_path(self):
        return super()._parse_path()


def _make_handler(path):
    return _MockHandler(path)
