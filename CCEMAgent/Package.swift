// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "CCEMAgent",
    platforms: [
        .macOS(.v14)
    ],
    targets: [
        .executableTarget(
            name: "CCEMAgent",
            path: "Sources/CCEMAgent",
            resources: [
                .copy("../../Resources/Info.plist")
            ]
        )
    ]
)
