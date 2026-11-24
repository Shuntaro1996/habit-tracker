// 公開用ビルド（dist/）から、ネットなしでも開けるようにする sw.js を作る設定。
// `npm run build:web` の中で使われる。
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,html,css,json,png,ico,ttf}'],
  swDest: 'dist/sw.js',
  // アプリ本体のJSは大きめなので、保存できるファイルサイズの上限を広げる
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  // デバッグ用の .map ファイルは公開しない（PC内のフォルダ名が入ってしまうため）
  sourcemap: false,
  // 新しい版を公開したら、次に開いたときに切り替わるようにする
  skipWaiting: true,
  clientsClaim: true,
};
