export const featureFlags = {
  enableLegacyOnboarding:
    process.env.NEXT_PUBLIC_ENABLE_LEGACY_ONBOARDING === 'true',
  enableCanonicalProductStateApi:
    process.env.NEXT_PUBLIC_ENABLE_PRODUCT_STATE_API !== 'false',
  enableShellVariantLabs:
    process.env.NEXT_PUBLIC_ENABLE_SHELL_VARIANT_LABS !== 'false',
};
