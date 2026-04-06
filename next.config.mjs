/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // `@xenova/transformers` uses `onnxruntime-node` in Node environments.
        // We must keep it as a runtime dependency (not bundled) because it ships native `.node` binaries.
        if (isServer) {
            config.externals = [...(config.externals ?? []), "onnxruntime-node"];
        }

        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
        };
        return config;
    },
};

export default nextConfig;
