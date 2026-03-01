import type { AuthUser } from '@kanbang/shared';

declare global {
  namespace App {
    interface Locals {
      user: AuthUser | null;
    }
    interface PageData {
      user: AuthUser | null;
    }
  }
}

export {};
