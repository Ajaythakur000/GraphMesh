/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false, 
  },
  allowedDevOrigins: ['10.38.22.12'],
};

export default nextConfig;