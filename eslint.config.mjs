import eslint from '@eslint/js';
import { defineConfig } from "eslint/config";
import tseslint from 'typescript-eslint';

export default defineConfig(
    {
        ignores: ["dist/**", "node_modules/**", "bin/**"]
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
        }
    }
);