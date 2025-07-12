import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-abi-exporter';

const INFURA_API_KEY = vars.get("INFURA_API_KEY");
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      chainId: 31337,
      url: "http://localhost:8545"
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    }
  },
  mocha: {
    timeout: 20000 // Set timeout to 20 seconds
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY")
    },
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      }
    ]
  },
};

export default config;
