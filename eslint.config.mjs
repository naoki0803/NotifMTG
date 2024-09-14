import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    // 対象ファイルを指定し、グローバルな言語オプションを適用
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node, // Node.js 環境のグローバル変数を許可
      },
      sourceType: "commonjs"
    },
    ignores: ["**/src/res.js"], // 無視するファイルを指定
    // 推奨設定を適用
    ...pluginJs.configs.recommended,
    // カスタムルールを指定
    rules: {
      "no-unused-vars": ["error"], // 未使用の変数をエラーとして検出
      "no-undef": ["error"], // 未定義の変数をエラーとして検出
      eqeqeq: ["error", "always"], // 厳密な等価演算子を強制
      "no-console": ["warn"], // console.log の使用を警告
      indent: ["error", 2], // インデントを2スペースで強制
      quotes: ["error", "single"], // シングルクォートを強制
      semi: ["error", "always"], // セミコロンを必須に
      "brace-style": ["error", "1tbs"], // ブレースのスタイルを "1tbs" に強制
      camelcase: ["error", { properties: "always" }], // キャメルケースを強制
      // "newline-after-var": ["error", "always"], // 変数宣言後の空行を強制（コメントアウト中）
      "no-magic-numbers": ["warn", { ignore: [0, 1] }], // マジックナンバーの使用を警告
      "consistent-return": ["error"], // 一貫した return を強制
      complexity: ["warn", { max: 10 }], // 関数の複雑さを制限
      "prefer-const": ["error"], // 再代入されない変数に const を推奨
      "no-var": ["error"], // var の使用を禁止
      // "import/no-unresolved": ["error"], // モジュールの解決をチェック（コメントアウト中）
    },
  },
];