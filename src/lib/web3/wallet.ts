import { ethers } from 'ethers'

export interface WalletState {
  address: string
  balance: string
  chainId: number
  isConnected: boolean
  provider: any
  signer: any
  network: {
    name: string
    chainId: number
  }
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export class WalletService {
  private state: WalletState = {
    address: '',
    balance: '0',
    chainId: 1,
    isConnected: false,
    provider: null,
    signer: null,
    network: {
      name: 'Unknown',
      chainId: 1
    }
  }

  private listeners: Array<(state: WalletState) => void> = []
  private isInitialized = false

  constructor() {
    this.initializeEventListeners()
  }

  private async initializeEventListeners() {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.warn('MetaMask not installed')
      return
    }

    try {
      // Initialize provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Set up event listeners
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this))
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this))
      window.ethereum.on('disconnect', this.handleDisconnect.bind(this))
      window.ethereum.on('connect', this.handleConnect.bind(this))
      
      this.isInitialized = true
      console.log('Wallet service initialized successfully')
    } catch (error) {
      console.error('Error initializing wallet service:', error)
    }
  }

  private async handleAccountsChanged(accounts: string[]) {
    console.log('Accounts changed:', accounts)
    
    if (accounts.length > 0) {
      await this.updateAccount(accounts[0])
    } else {
      await this.disconnect()
    }
  }

  private async handleChainChanged(chainId: string) {
    console.log('Chain changed:', chainId)
    const newChainId = parseInt(chainId, 16)
    await this.updateChainId(newChainId)
  }

  private async handleDisconnect(error: { code: number; message: string }) {
    console.log('Wallet disconnected:', error)
    await this.disconnect()
  }

  private async handleConnect(connectInfo: { chainId: string }) {
    console.log('Wallet connected:', connectInfo)
    const chainId = parseInt(connectInfo.chainId, 16)
    await this.updateChainId(chainId)
    
    // Try to get current account
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        await this.updateAccount(accounts[0])
      }
    } catch (error) {
      console.error('Error getting accounts after connect:', error)
    }
  }

  subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state))
  }

  async connect(): Promise<WalletState> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
    }

    try {
      console.log('Connecting wallet...')
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect an account.')
      }

      const address = accounts[0]
      
      // Initialize provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()
      const balance = await provider.getBalance(address)

      this.state = {
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true,
        provider,
        signer,
        network: {
          name: network.name,
          chainId: Number(network.chainId)
        }
      }

      this.notifyListeners()
      console.log('Wallet connected successfully:', address)
      return this.state
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      
      // Handle specific error cases
      if (error.code === 4001) {
        throw new Error('Connection rejected by user. Please approve the connection request.')
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check MetaMask.')
      } else if (error.code === 4902) {
        throw new Error('Network not added to MetaMask. Please add the network first.')
      } else {
        throw new Error(`Failed to connect wallet: ${error.message || 'Unknown error'}`)
      }
    }
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting wallet...')
    
    this.state = {
      address: '',
      balance: '0',
      chainId: 1,
      isConnected: false,
      provider: null,
      signer: null,
      network: {
        name: 'Unknown',
        chainId: 1
      }
    }
    
    this.notifyListeners()
    console.log('Wallet disconnected')
  }

  private async updateAccount(address: string) {
    if (!this.state.provider) return

    try {
      console.log('Updating account:', address)
      
      const balance = await this.state.provider.getBalance(address)
      const network = await this.state.provider.getNetwork()

      this.state = {
        ...this.state,
        address,
        balance: ethers.formatEther(balance),
        network: {
          name: network.name,
          chainId: Number(network.chainId)
        }
      }
      
      this.notifyListeners()
      console.log('Account updated successfully')
    } catch (error) {
      console.error('Error updating account:', error)
    }
  }

  private async updateChainId(chainId: number) {
    console.log('Updating chain ID:', chainId)
    
    try {
      let networkName = 'Unknown'
      
      // Try to get network name from provider if available
      if (this.state.provider) {
        try {
          const network = await this.state.provider.getNetwork()
          networkName = network.name
        } catch (error) {
          console.warn('Could not get network name:', error)
        }
      }

      // Fallback network names
      const networkNames: Record<number, string> = {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet',
        11155111: 'Sepolia Testnet',
        137: 'Polygon Mainnet',
        80001: 'Mumbai Testnet',
        56: 'BSC Mainnet',
        97: 'BSC Testnet',
        43114: 'Avalanche Mainnet',
        43113: 'Avalanche Testnet',
        250: 'Fantom Mainnet',
        4002: 'Fantom Testnet'
      }

      networkName = networkNames[chainId] || networkName

      this.state = {
        ...this.state,
        chainId,
        network: {
          name: networkName,
          chainId
        }
      }
      
      this.notifyListeners()
      console.log('Chain ID updated successfully:', networkName)
    } catch (error) {
      console.error('Error updating chain ID:', error)
    }
  }

  getState(): WalletState {
    return { ...this.state }
  }

  async sendTransaction(to: string, amount: string): Promise<string> {
    if (!this.state.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log('Sending transaction:', { to, amount })
      
      // Parse amount to ether
      const amountInEther = ethers.parseEther(amount)
      
      // Get current gas price
      const gasPrice = await this.state.provider.getFeeData()
      
      // Send transaction
      const tx = await this.state.signer.sendTransaction({
        to,
        value: amountInEther,
        gasPrice: gasPrice.gasPrice
      })

      console.log('Transaction sent:', tx.hash)
      
      // Wait for transaction to be mined
      const receipt = await tx.wait()
      
      console.log('Transaction confirmed:', receipt.hash)
      
      return tx.hash
      
    } catch (error: any) {
      console.error('Error sending transaction:', error)
      
      // Handle specific error cases
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user.')
      } else if (error.code === -32603 && error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for this transaction.')
      } else if (error.code === -32603 && error.message.includes('gas')) {
        throw new Error('Gas estimation failed. Transaction may fail.')
      } else {
        throw new Error(`Failed to send transaction: ${error.message || 'Unknown error'}`)
      }
    }
  }

  async getBalance(): Promise<string> {
    if (!this.state.provider || !this.state.address) {
      return '0'
    }

    try {
      const balance = await this.state.provider.getBalance(this.state.address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error getting balance:', error)
      return '0'
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed')
    }

    try {
      console.log('Switching to network:', chainId)
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })
      
      console.log('Network switched successfully')
    } catch (error: any) {
      console.error('Error switching network:', error)
      
      if (error.code === 4902) {
        throw new Error('Network not added to MetaMask. Please add the network first.')
      } else if (error.code === 4001) {
        throw new Error('Network switch rejected by user.')
      } else {
        throw new Error(`Failed to switch network: ${error.message || 'Unknown error'}`)
      }
    }
  }

  async addNetwork(chainId: number, chainName: string, currencySymbol: string, rpcUrl: string): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed')
    }

    try {
      console.log('Adding network:', { chainId, chainName })
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName,
          nativeCurrency: {
            name: currencySymbol,
            symbol: currencySymbol,
            decimals: 18
          },
          rpcUrls: [rpcUrl]
        }]
      })
      
      console.log('Network added successfully')
    } catch (error: any) {
      console.error('Error adding network:', error)
      
      if (error.code === 4001) {
        throw new Error('Network addition rejected by user.')
      } else {
        throw new Error(`Failed to add network: ${error.message || 'Unknown error'}`)
      }
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.state.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log('Signing message:', message)
      
      const signature = await this.state.signer.signMessage(message)
      
      console.log('Message signed successfully')
      return signature
      
    } catch (error: any) {
      console.error('Error signing message:', error)
      
      if (error.code === 4001) {
        throw new Error('Message signing rejected by user.')
      } else {
        throw new Error(`Failed to sign message: ${error.message || 'Unknown error'}`)
      }
    }
  }

  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum
  }

  async getProvider(): Promise<any> {
    if (!this.state.provider) {
      throw new Error('Provider not available')
    }
    return this.state.provider
  }

  async getSigner(): Promise<any> {
    if (!this.state.signer) {
      throw new Error('Signer not available')
    }
    return this.state.signer
  }
}

// Global wallet service instance
export const walletService = new WalletService()