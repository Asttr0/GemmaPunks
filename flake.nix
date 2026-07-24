{
  description = "NodeJS Dev Shell";

  inputs = {
    nixpkgs = {
      url = "github:nixos/nixpkgs/241313f4e8e508cb9b13278c2b0fa25b9ca27163";
    };
  };

  outputs =
    { self, nixpkgs, ... }@inputs:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          nodejs_24
        ];

        shellHook = ''
          echo "NodeJS Dev Environment Loaded"
        '';

      };
    };

}
