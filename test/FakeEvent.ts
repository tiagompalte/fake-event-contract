import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("FakeEvent", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFakeEventFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const FakeEvent = await hre.ethers.getContractFactory("FakeEvent");
    const fakeEvent = await FakeEvent.deploy(owner.address, "https://example.com/ticket");

    return { fakeEvent, owner, otherAccount };
  }

  describe("mint", function () {
    it("Should revert if the ticket does not exist", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);

      const nonExistentTicketId = 9999; // Assuming this ID does not exist

      await expect(fakeEvent.mint(nonExistentTicketId, 1))
        .to.be.revertedWith("Invalid ticket ID");
    });

    it("Should revert if exceeds max tickets per purchase", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();

      // Assuming the max tickets per purchase is 10
      await expect(fakeEvent.mint(regularTicket, 11, { value: hre.ethers.parseEther("0.05") }))
        .to.be.revertedWith("Exceeds max tickets per purchase");
    });      

    it("Should revert if the sender does not send enough ether", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);

      const vipTicket = await fakeEvent.VIP_TICKET();

      // Assuming the price for a VIP ticket is 0.15 ether
      await expect(fakeEvent.mint(vipTicket, 1, { value: hre.ethers.parseEther("0.1") }))
        .to.be.revertedWith("Minting amount is invalid");
    });

    it("Should revert if the ticket amount is zero", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);

      const vipTicket = await fakeEvent.VIP_TICKET();

      await expect(fakeEvent.mint(vipTicket, 0))
        .to.be.revertedWith("Quantity must be greater than 0");
    });

    it("Should revert if the ticket amount exceeds the maximum supply", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);

      const vipTicket = await fakeEvent.VIP_TICKET();
      await fakeEvent.setMaxSupply(vipTicket, 9); // Set max supply for the test
      const maxSupply = await fakeEvent.maxSupply(vipTicket);

      await expect(fakeEvent.mint(vipTicket, Number(maxSupply) + 1, { value: hre.ethers.parseEther("1.5") }))
        .to.be.revertedWith("Minting is not available for this token");
    });
    
    it("Should mint a regular ticket", async function () {
      const { fakeEvent, owner } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();
      
      await fakeEvent.mint(regularTicket, 1, { value: hre.ethers.parseEther("0.05") });

      const balance = await fakeEvent.balanceOf(owner.address, regularTicket);
      expect(balance).to.equal(1);
    });

    it("Should mint a premium ticket", async function () {
      const { fakeEvent, owner } = await loadFixture(deployFakeEventFixture);
      const premiumTicket = await fakeEvent.PREMIUM_TICKET();
      
      await fakeEvent.mint(premiumTicket, 1, { value: hre.ethers.parseEther("0.1") });
      
      const balance = await fakeEvent.balanceOf(owner.address, premiumTicket);
      expect(balance).to.equal(1);
    });          

    it("Should mint a vip ticket", async function () {
      const { fakeEvent, owner } = await loadFixture(deployFakeEventFixture);
      const vipTicket = await fakeEvent.VIP_TICKET();
      
      await fakeEvent.mint(vipTicket, 1, { value: hre.ethers.parseEther("0.15") });

      const balance = await fakeEvent.balanceOf(owner.address, vipTicket);
      expect(balance).to.equal(1);
    });
  });

  describe("setMaxSupply", function () {
    it("Should set the max supply for a ticket type", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const vipTicket = await fakeEvent.VIP_TICKET();

      await fakeEvent.setMaxSupply(vipTicket, 100);

      const maxSupply = await fakeEvent.maxSupply(vipTicket);
      expect(maxSupply).to.equal(100);
    });

    it("Should revert if the caller is not the owner", async function () {
      const { fakeEvent, otherAccount } = await loadFixture(deployFakeEventFixture);
      const vipTicket = await fakeEvent.VIP_TICKET();

      await expect(fakeEvent.connect(otherAccount).setMaxSupply(vipTicket, 100))
        .to.be.revertedWithCustomError(fakeEvent, "OwnableUnauthorizedAccount");
    });
  });

  describe("getTicketPrice", function () {
    it("Should return the correct price for a regular ticket", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();

      const price = await fakeEvent.tokenPrices(regularTicket);
      expect(price).to.equal(hre.ethers.parseEther("0.05"));
    });

    it("Should return the correct price for a premium ticket", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const premiumTicket = await fakeEvent.PREMIUM_TICKET();

      const price = await fakeEvent.tokenPrices(premiumTicket);
      expect(price).to.equal(hre.ethers.parseEther("0.1"));
    });

    it("Should return the correct price for a VIP ticket", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const vipTicket = await fakeEvent.VIP_TICKET();

      const price = await fakeEvent.tokenPrices(vipTicket);
      expect(price).to.equal(hre.ethers.parseEther("0.15"));
    });
  });

  describe("availableSupply", function () {
    it("Should return the available tickets for a given ticket type", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();

      const available = await fakeEvent.availableSupply(regularTicket);
      expect(available).to.equal(500); // Assuming initial supply is set to 500
    });

    it("Should return zero if no tickets are available", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const vipTicket = await fakeEvent.VIP_TICKET();

      // Set max supply to 0 for this test
      await fakeEvent.setMaxSupply(vipTicket, 0);

      const available = await fakeEvent.availableSupply(vipTicket);
      expect(available).to.equal(0);
    });
  });

  describe("mintBatch", function () {
    it("Should revert if the ticket does not exist", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);

      const nonExistentTicketId = 9999; // Assuming this ID does not exist

      await expect(fakeEvent.mintBatch([nonExistentTicketId], [1], { value: hre.ethers.parseEther("0.05") }))
        .to.be.revertedWith("Invalid ticket ID");
    });

    it("Should revert if exceeds max tickets per purchase", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();

      // Assuming the max tickets per purchase is 10
      await expect(fakeEvent.mintBatch([regularTicket], [11], { value: hre.ethers.parseEther("0.05") }))
        .to.be.revertedWith("Exceeds max tickets per purchase");
    });

    it("Should revert if the sender does not send enough ether", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);

      const vipTicket = await fakeEvent.VIP_TICKET();

      // Assuming the price for a VIP ticket is 0.15 ether
      await expect(fakeEvent.mintBatch([vipTicket], [1], { value: hre.ethers.parseEther("0.1") }))
        .to.be.revertedWith("Total minting amount is invalid");
    });

    it("Should revert if the ticket amount is zero", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);

      const vipTicket = await fakeEvent.VIP_TICKET();

      await expect(fakeEvent.mintBatch([vipTicket], [0]))
        .to.be.revertedWith("Quantity must be greater than 0");
    });

    it("Should revert if the ticket amount exceeds the maximum supply", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);

      const vipTicket = await fakeEvent.VIP_TICKET();
      await fakeEvent.setMaxSupply(vipTicket, 9); // Set max supply for the test
      const maxSupply = await fakeEvent.maxSupply(vipTicket);

      await expect(fakeEvent.mintBatch([vipTicket], [Number(maxSupply) + 1], { value: hre.ethers.parseEther("150.15") }))
        .to.be.revertedWith("Minting is not available for this token");
    });

    it("Should mint a batch of tickets", async function () {
      const { fakeEvent, owner } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();
      const premiumTicket = await fakeEvent.PREMIUM_TICKET();

      await fakeEvent.mintBatch([regularTicket, premiumTicket], [1, 1], { value: hre.ethers.parseEther("0.15") });

      const regularBalance = await fakeEvent.balanceOf(owner.address, regularTicket);
      const premiumBalance = await fakeEvent.balanceOf(owner.address, premiumTicket);
      expect(regularBalance).to.equal(1);
      expect(premiumBalance).to.equal(1);
    });
  });

  describe("withdraw", function () {
    it("Should allow the owner to withdraw funds", async function () {
      const { fakeEvent, owner, otherAccount } = await loadFixture(deployFakeEventFixture);
      const initialBalance = await hre.ethers.provider.getBalance(owner.address);

      // Mint a ticket to generate some funds
      const vipTicket = await fakeEvent.VIP_TICKET();
      await fakeEvent.connect(otherAccount).mint(vipTicket, 1, { value: hre.ethers.parseEther("0.15") });

      // Withdraw funds
      await fakeEvent.connect(owner).withdraw();

      const finalBalance = await hre.ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should revert if a non-owner tries to withdraw", async function () {
      const { fakeEvent, otherAccount } = await loadFixture(deployFakeEventFixture);

      await expect(fakeEvent.connect(otherAccount).withdraw())
        .to.be.revertedWithCustomError(fakeEvent, "OwnableUnauthorizedAccount");
    });
  });

  describe("uri", function () {
    it("Should return the correct URI for a ticket type", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();

      const uri = await fakeEvent.uri(regularTicket);
      expect(uri).to.equal(`https://example.com/ticket/${regularTicket}.json`);
    });

    it("Should return the correct URI for a premium ticket", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const premiumTicket = await fakeEvent.PREMIUM_TICKET();

      const uri = await fakeEvent.uri(premiumTicket);
      expect(uri).to.equal(`https://example.com/ticket/${premiumTicket}.json`);
    });

    it("Should return the correct URI for a VIP ticket", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const vipTicket = await fakeEvent.VIP_TICKET();

      const uri = await fakeEvent.uri(vipTicket);
      expect(uri).to.equal(`https://example.com/ticket/${vipTicket}.json`);
    });

    it("Should set URI", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const newUri = "https://new.example.com/ticket";

      await fakeEvent.setURI(newUri);

      const regularTicket = await fakeEvent.REGULAR_TICKET();
      const uri = await fakeEvent.uri(regularTicket);
      expect(uri).to.equal(`${newUri}/${regularTicket.toString()}.json`);
    });
  });

  describe("setTokenPrice", function () {
    it("Should set the price for a ticket type", async function () {
      const { fakeEvent } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();

      await fakeEvent.setTokenPrice(regularTicket, hre.ethers.parseEther("0.06"));

      const price = await fakeEvent.tokenPrices(regularTicket);
      expect(price).to.equal(hre.ethers.parseEther("0.06"));
    });

    it("Should revert if the caller is not the owner", async function () {
      const { fakeEvent, otherAccount } = await loadFixture(deployFakeEventFixture);
      const regularTicket = await fakeEvent.REGULAR_TICKET();

      await expect(fakeEvent.connect(otherAccount).setTokenPrice(regularTicket, hre.ethers.parseEther("0.06")))
        .to.be.revertedWithCustomError(fakeEvent, "OwnableUnauthorizedAccount");
    });
  });

  describe("pause", function () {
    it("Should pause the contract", async function () {
      const { fakeEvent, owner } = await loadFixture(deployFakeEventFixture);

      await fakeEvent.connect(owner).pause();

      expect(await fakeEvent.paused()).to.be.true;
    });

    it("Should revert if a non-owner tries to pause", async function () {
      const { fakeEvent, otherAccount } = await loadFixture(deployFakeEventFixture);

      await expect(fakeEvent.connect(otherAccount).pause())
        .to.be.revertedWithCustomError(fakeEvent, "OwnableUnauthorizedAccount");
    });
  });

  describe("unpause", function () {
    it("Should unpause the contract", async function () {
      const { fakeEvent, owner } = await loadFixture(deployFakeEventFixture);

      await fakeEvent.connect(owner).pause(); // First pause the contract
      await fakeEvent.connect(owner).unpause();

      expect(await fakeEvent.paused()).to.be.false;
    });

    it("Should revert if a non-owner tries to unpause", async function () {
      const { fakeEvent, otherAccount } = await loadFixture(deployFakeEventFixture);

      await expect(fakeEvent.connect(otherAccount).unpause())
        .to.be.revertedWithCustomError(fakeEvent, "OwnableUnauthorizedAccount");
    });
  });

});
