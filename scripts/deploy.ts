import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const FakeEvent = await ethers.getContractFactory("FakeEvent");
    const fakeEvent = await FakeEvent.deploy(deployer.address, "");

    console.log("FakeEvent deployed to:", await fakeEvent.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});