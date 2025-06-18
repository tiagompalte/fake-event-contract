// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FakeEventModule = buildModule("FakeEventModule", (m) => {
  const fakeEvent = m.contract("FakeEvent");
  return { fakeEvent };
});

export default FakeEventModule;
