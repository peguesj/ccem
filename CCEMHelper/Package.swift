// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "CCEMHelper",
    platforms: [
        .macOS(.v14)
    ],
    targets: [
        .executableTarget(
            name: "CCEMHelper",
            path: "Sources/CCEMHelper",
            resources: [
                .copy("../../Resources/Info.plist")
            ]
        )
    ]
)
