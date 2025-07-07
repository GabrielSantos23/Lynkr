declare module "libsodium-wrappers" {
  import type * as _sodium from "libsodium-wrappers";
  const sodium: typeof _sodium;
  export = sodium;
}
