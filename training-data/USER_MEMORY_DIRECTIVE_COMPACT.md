# USER MEMORY DIRECTIVE - COMPACT PRIORITIZATION

**Status**: ACTIVE
**Priority**: CRITICAL
**Scope**: Context management and training efficiency
**Created**: 2025-10-11
**Version**: 1.0.0

---

## Core Directive

**When you need to run `/compact`, you should prioritize based on the trainings, so they need to be efficient to process.**

This means:
1. **Training observations are valuable** - they guide prioritization during compact
2. **Training must be efficient** - verbose training defeats compact purpose
3. **Prioritize intelligently** - not all content has equal value
4. **Preserve critical patterns** - user directives and key learnings must survive

---

## Training Efficiency Requirements

### ✅ DO: Write Efficient Training Observations
- **Bullet points** over paragraphs
- **References** instead of repetition
- **Structured data** over free text
- **Actionable insights** over descriptions
- **Priority tags** on all observations
- **Compact flags** marking compressible content

### ❌ DON'T: Write Inefficient Training Observations
- Long prose explanations
- Repeated patterns already documented
- Unnecessary timestamps on every field
- Obvious or trivial observations
- Verbose examples when concise suffice
- Training for routine operations

---

## Compact Prioritization Order

### Priority 1: CRITICAL (100% retention)
- User TRAINING directives
- Meta-directives about operation
- Explicit user preference statements
- Hard technical constraints

**Example**: "ALWAYS apply logical and typecast argument nesting syntax"

### Priority 2: HIGH VALUE (95% retention)
- Repeated user preferences
- Technical constraints discovered
- Edge cases with solutions
- Decision rationales for major features

**Example**: "User prefers tar.gz level 9 compression"

### Priority 3: IMPLEMENTATION (70% retention)
- Technical learnings
- Implementation challenges
- Alternative approaches considered

**Example**: "Claude Code uses :* for prefix matching, not bare *"

### Priority 4: CONTEXT (40% retention)
- Conversation flow details
- Timestamp information
- File modification logs

**Example**: "Created 17 files in phase 6"

### Priority 5: LOW VALUE (10% retention)
- Simple acknowledgments
- Routine operations without learning
- Duplicate patterns

**Example**: "User said thank you"

---

## Efficient Format Example

### ❌ Inefficient (800 tokens):
```json
{
  "interaction_id": "int-017",
  "timestamp": "2025-10-11T18:15:00Z",
  "user_message_number": 17,
  "user_input": "ok thank you",
  "user_intent": "The user is acknowledging the completion...",
  "assistant_action": "I provided a brief acknowledgment...",
  "training_observations": {
    "what_worked": ["Brief acknowledgment was appropriate..."],
    "patterns_emerged": ["Simple acknowledgments don't require..."]
  }
}
```

### ✅ Efficient (200 tokens):
```json
{
  "id": "int-017",
  "priority": 5,
  "type": "acknowledgment",
  "patterns": ["simple_ack_brief", "task_complete_sat"],
  "user_pref": "concise_simple_interactions",
  "impact": "low",
  "compact": true
}
```

**Savings**: 75% reduction, no critical information lost

---

## Pre-Compact Workflow

When `/compact` is needed:

### 1. ASSESS
Scan all training observations, assign priority rankings

### 2. DEDUPLICATE
Identify duplicate patterns, consolidate with counters

### 3. SUMMARIZE
Compress low-priority observations while preserving insights

### 4. PRESERVE
Mark critical observations for full retention

### 5. ARCHIVE
Move detailed observations to `~/.claude/ccem/training-data/archived/`

---

## Token Budget Guidelines

| Priority | Max Tokens | Usage |
|----------|------------|-------|
| Critical | Unlimited | User directives, key preferences |
| High Value | ~500 | Important patterns, constraints |
| Implementation | ~200 | Technical learnings |
| Context | ~100 | Metadata, flow info |
| Low Value | ~50 | Routine operations |

---

## Storage Strategy

### In Memory (Conversation Context)
- **Critical**: Full retention always
- **High Value**: Full until compact, then summarized
- **Medium**: Summarized immediately, expand on demand
- **Low**: Statistics only, details archived

### On Disk (Persistent Storage)
```
~/.claude/ccem/training-data/
├── current/          # Active session (full detail)
├── archived/         # Compacted sessions (full detail preserved)
├── summaries/        # Multi-level summaries
└── indices/          # Fast lookup by pattern, preference, etc.
```

---

## Success Criteria

✓ Compact reduces context by >50%
✓ Retains >95% of critical patterns
✓ No critical user directives lost
✓ Training remains actionable after compact
✓ Archived data accessible and useful
✓ Operation completes in <30 seconds

---

## Integration Points

- **TUI**: Add "Compact History" view
- **Preferences**: Compact aggressiveness settings
- **Snapshots**: Include compact metadata
- **Recommendations**: Optimize based on compact patterns
- **Hooks**: Use PreCompact for training archival

---

## Key Principle

**Training observations enable intelligent compact prioritization. Make them efficient so compact remains effective.**

Verbose training observations create a paradox: the more training we capture, the more we need to compact, the less training we can retain. Efficient training breaks this cycle.

---

**REMEMBER**: Every training observation should answer: "If I had to compact this conversation, what absolutely must be preserved?"
