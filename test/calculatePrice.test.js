const { expect } = require('chai')
const { ethers } = require('hardhat')

const { calculatePrice } = require('../helpers/helpers')

describe('helpers/calculatePrice()', function () {
  it('returns token1-per-token0 (same decimals)', async function () {
    const token0 = '0x0000000000000000000000000000000000000010'
    const token1 = '0x0000000000000000000000000000000000000020'

    const Q96 = 2n ** 96n
    const sqrtPriceX96 = 2n * Q96 // sqrt(4) * 2^96

    const Pool = await ethers.getContractFactory('MockV3Pool')
    const pool = await Pool.deploy(token0, token1, sqrtPriceX96)

    const price = await calculatePrice(pool, { address: token0, decimals: 18 }, { address: token1, decimals: 18 })
    expect(Number(price)).to.be.closeTo(4, 1e-12)
  })

  it('inverts when requested order is opposite of pool order', async function () {
    const token0 = '0x0000000000000000000000000000000000000010'
    const token1 = '0x0000000000000000000000000000000000000020'

    const Q96 = 2n ** 96n
    const sqrtPriceX96 = 2n * Q96 // price=4 in pool order

    const Pool = await ethers.getContractFactory('MockV3Pool')
    const pool = await Pool.deploy(token0, token1, sqrtPriceX96)

    const price = await calculatePrice(pool, { address: token1, decimals: 18 }, { address: token0, decimals: 18 })
    expect(Number(price)).to.be.closeTo(0.25, 1e-12)
  })

  it('applies decimals adjustment (token0 decimals < token1 decimals)', async function () {
    const token0 = '0x0000000000000000000000000000000000000010'
    const token1 = '0x0000000000000000000000000000000000000020'

    const Q96 = 2n ** 96n
    const sqrtPriceX96 = 2n * Q96 // raw ratio=4

    const Pool = await ethers.getContractFactory('MockV3Pool')
    const pool = await Pool.deploy(token0, token1, sqrtPriceX96)

    // human price = 4 * 10^(6-18) = 4e-12
    const price = await calculatePrice(pool, { address: token0, decimals: 6 }, { address: token1, decimals: 18 })
    expect(Number(price)).to.be.closeTo(4e-12, 1e-18)
  })
})

