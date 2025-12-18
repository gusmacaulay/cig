{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_20
  ];

  shellHook = ''
    echo "🚬 CIGARETTES & INSULTS DEV SHELL 🤬"
    echo "Run 'npm run dev' to start the server."
  '';
}
