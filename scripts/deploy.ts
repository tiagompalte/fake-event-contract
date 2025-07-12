import { ethers, run } from "hardhat";
import { vars } from "hardhat/config";

async function verifyContract(address: string, constructorArguments: any[]) {
    console.log("Verifying contract on Etherscan...");
    await run("verify:verify", {
        address,
        constructorArguments,
    });
    console.log("Contract verified successfully!");
}

async function deployContract(deployerAddress: string, fakeEventUri: string): Promise<string> {
   console.log("Deploying contracts with the account:", deployerAddress);

    const FakeEvent = await ethers.getContractFactory("FakeEvent");
    const fakeEvent = await FakeEvent.deploy(deployerAddress, fakeEventUri);
    const contractAddress = await fakeEvent.getAddress();

    console.log("FakeEvent deployed to:", contractAddress);

    return contractAddress;
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const fakeEventUri = vars.get("FAKE_EVENT_URI");
    
    const contractAddress = await deployContract(deployer.address, fakeEventUri);
    const constructorArguments = [deployer.address, fakeEventUri];

    await verifyContract(contractAddress, constructorArguments);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});