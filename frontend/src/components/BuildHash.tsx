export function BuildHash() {
  return (
    <a
      href={`https://github.com/kvrvgv/GeLearner/commit/${__COMMIT_HASH__}`}
      target="_blank"
      rel="noreferrer"
      className="build-hash"
    >
      #{__COMMIT_HASH__}
    </a>
  );
}
