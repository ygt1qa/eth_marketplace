const { assert } = require('chai')

const Marcketplace = artifacts.require('./Marcketplace.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Marcketplace', ([deployer, seller, buyer]) => {
    let marcketplace

    before(async () => {
        marcketplace = await Marcketplace.deployed()
    })

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = await marcketplace.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has a name', async () => {
            const name = await marcketplace.name()
            assert.equal(name, 'Dapp University Marcketplace')
        })
    })

    describe('product', async () => {
        let result, productCount

        before(async () => {
            result = await marcketplace.createProduct('iPhone X', web3.utils.toWei('1', 'Ether'), { from: seller })
            productCount = await marcketplace.productCount()
        })
    
        it('creates products', async () => {
            // SUCCESS
            assert.equal(productCount, 1)
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'iPhone X', 'name is correct')
            assert.equal(event.price, '1000000000000000000', 'price is correct')
            assert.equal(event.owner, seller, 'owner is correct')
            assert.equal(event.purchased, false, 'purchased is correct')

            // FAILED: Product must have a name
            await marcketplace.createProduct('', web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected
            // FAILED: Product must have a price
            await marcketplace.createProduct('iPhone X', 0, { from: seller }).should.be.rejected
        })
    
        it('lists products', async () => {
            const product = await marcketplace.products(productCount)
            assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(product.name, 'iPhone X', 'name is correct')
            assert.equal(product.price, '1000000000000000000', 'price is correct')
            assert.equal(product.owner, seller, 'owner is correct')
            assert.equal(product.purchased, false, 'purchased is correct')
        })
    
        it('sells products', async () => {
            // Track the seller balance before purchase
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(seller)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)
            
            // SUCCESS: Buyer makes purchased
            result = await marcketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') }) 
            
            // Check logs
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'iPhone X', 'name is correct')
            assert.equal(event.price, '1000000000000000000', 'price is correct')
            assert.equal(event.owner, buyer, 'owner is correct')
            assert.equal(event.purchased, true, 'purchased is correct')
            
            // Check that seller received funds
            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(seller)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            let price
            price = web3.utils.toWei('1', 'Ether')
            price = new web3.utils.BN(price)

            const expectedBalance = oldSellerBalance.add(price)
            assert.equal(newSellerBalance.toString(), expectedBalance.toString())

            // FAILED: Tries to buy a product thar does not exist, i.e., product must have valid id
            await marcketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected
            // FAILURE: Buyer tries to buy without enough ether
            await marcketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected
            // FAILURE: Deployer tries to buy the product, i.e., product cant be purchased twice
            await marcketplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected
            // FAILURE: Buyer tries to buy again, i.e., buyer cant be the seller
            await marcketplace.purchaseProduct(productCount, { from: seller, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected
        })

    })

})