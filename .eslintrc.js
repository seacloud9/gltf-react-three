/*global module */
/*eslint no-undef: "error"*/
module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends":['eslint:recommended', 'plugin:@next/next/recommended', 'plugin:react/recommended'],
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "react/no-unknown-property": ['off']
    },
}
