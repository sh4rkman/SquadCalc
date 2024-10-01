import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        ignores: ["**/tests/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                ...globals.jquery,
            }
        },
        rules: {
            indent: [
                "error",
                4
            ],
            "no-compare-neg-zero": "off",
            "keyword-spacing": [
                "error",
                { "before": true }
            ],
            "linebreak-style": [
                "error",
                "windows"
            ],
            "quotes": [
                "error",
                "double"
            ],
            "semi": [
                "error",
                "always"
            ],
            "semi-spacing": [
                "error",
                {"before": false, "after": true}
            ],
            "space-unary-ops": [
                "error",
                {"words": true, "nonwords": false}
            ],
            "vars-on-top": [
                "error"
            ]
        }
    }
];