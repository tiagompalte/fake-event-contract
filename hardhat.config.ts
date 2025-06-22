import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-abi-exporter';

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      initialBaseFeePerGas: 0,
    },
    localhost: {
      url: "http://localhost:8545"
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/<key>",
      accounts: []
    }
  },
  mocha: {
    timeout: 20000 // Set timeout to 20 seconds
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 20,
    outputFile: "gas-report.txt",
    noColors: true,
    showTimeSpent: true,
    coinmarketcap: "<your-coinmarketcap-api-key>",
    token: "ETH"
  },
  etherscan: {
    apiKey: {
      sepolia: "<your-etherscan-api-key>"
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
