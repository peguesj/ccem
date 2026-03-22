import Foundation
import CryptoKit

actor DriftDetector {
    private var claudeMDChecksums: [String: String] = [:]
    private var apmConfigChecksum: String?

    private let apmConfigPath: String = {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return "\(home)/Developer/ccem/apm/apm_config.json"
    }()

    func detectDrift(for project: APMProject) -> DriftStatus {
        var reasons: [String] = []

        if let root = project.projectRoot {
            let claudeMDPath = "\(root)/.claude/CLAUDE.md"
            if let newChecksum = checksumFile(at: claudeMDPath) {
                let key = project.id
                if let previous = claudeMDChecksums[key], previous != newChecksum {
                    reasons.append("CLAUDE.md changed")
                }
                claudeMDChecksums[key] = newChecksum
            }
        }

        if let newChecksum = checksumFile(at: apmConfigPath) {
            if let previous = apmConfigChecksum, previous != newChecksum {
                reasons.append("apm_config.json changed")
            }
            apmConfigChecksum = newChecksum
        }

        if reasons.isEmpty {
            return .clean
        }
        return .drifted(reasons.joined(separator: ", "))
    }

    func resetBaseline(for projectId: String) {
        claudeMDChecksums.removeValue(forKey: projectId)
    }

    private func checksumFile(at path: String) -> String? {
        guard let data = FileManager.default.contents(atPath: path) else {
            return nil
        }
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
