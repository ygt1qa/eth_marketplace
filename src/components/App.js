import React, { Component } from 'react';
import Web3 from 'web3';
import logo from '../logo.png';
import './App.css';
import Marketplace from '../abis/Marcketplace.json';
import Navbar from './Navbar';
import Main from './Main';
class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    window.addEventListener('load', async () => {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum)
        await window.ethereum.enable()
      }
      else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      }
      else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask')
      }
    });
  }

  async loadBlockchainData() {
    // Load Account
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    this.setState({ account: accounts[0] })
    const networkId = await window.web3.eth.net.getId()
    const networkData = Marketplace.networks[networkId]
    if (networkData) {
      const marketplace = new window.web3.eth.Contract(Marketplace.abi, networkData.address)
      this.setState({ marketplace: marketplace })
      const productCount = await marketplace.methods.productCount().call()
      // for (var i = 1; i <= 1; i++) {
      //   const product = await marketplace.methods.products(i).call()
      //   this.setState({
      //     products: [...this.state.products, product]
      //   })
      // }
      this.setState({ loading: false })
    } else {
      window.alert('Marketplace contract not deployed to detected newwork')
    }

  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      productCount: 0,
      products: [],
      loading: true
    }
    this.createProduct = this.createProduct.bind(this)
  }

  createProduct(name, price) {
    this.setState({ loading: true })
    this.state.marketplace.methods.createProduct(name, price).send({ from: this.state.account })
      .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading
                ? <div id="loader" className="text-center"><p className="text-center">Loading...</p></div>
                : <Main createProduct={this.createProduct}/>
              }
            </main>
          </div>
        </div>

      </div>
    );
  }
}

export default App;
