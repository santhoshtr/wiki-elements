export default [
  {
    "languageOptions": {
      "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "allowImportExportEverywhere": true,
        "ecmaFeatures": {
          "impliedStrict": true
        }
      },
      "globals": {
        "browser": true,
        "node": true
      },
    },

    "rules": {
      "semi": 1,
      "no-dupe-args": 1,
      "no-dupe-keys": 1,
      "no-unreachable": 1,
      "valid-typeof": 1,
      "curly": 1,
      "no-useless-call": 1,
      "brace-style": [1, "stroustrup"],
      "no-mixed-spaces-and-tabs": [1, "smart-tabs"],
      "quotes": [1, "double", "avoid-escape"],
      "spaced-comment": [
        1,
        "always",
        {
          "block": {
            "exceptions": ["*"]
          }
        }
      ],
      "arrow-spacing": 1,
      "comma-spacing": 1,
      "keyword-spacing": 1
    }
  }
];
