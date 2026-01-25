const { expect } = require("chai")

describe("Arbitrage", () => {
  let owner
  let arbitrage

  beforeEach(async () => {
    [owner] = await ethers.getSigners()

    arbitrage = await hre.ethers.deployContract("Arbitrage")
    await arbitrage.waitForDeployment()
  })

  describe("Deployment", () => {
    it("Sets the owner", async () => {
      expect(await arbitrage.owner()).to.equal(await owner.getAddress())
    })
  })

  describe("Safe ERC20 handling", () => {
    it("Does not revert when approving a non-standard token (no return data)", async () => {
      const [owner, spender] = await ethers.getSigners()

      const token = await hre.ethers.deployContract(
        "NonStandardERC20",
        ["NonStandard", "NST", 18, hre.ethers.parseEther("100")]
      )
      await token.waitForDeployment()

      const harness = await hre.ethers.deployContract("ArbitrageHarness")
      await harness.waitForDeployment()

      // Should not revert
      await harness.harnessSafeApprove(await token.getAddress(), await spender.getAddress(), 123n)

      const allowance = await token.allowance(await harness.getAddress(), await spender.getAddress())
      expect(allowance).to.equal(123n)
    })
  })

  describe("Trading", () => {

    /**
     * Feel Free to customize and add in your own unit testing here.
     */

  })
})
