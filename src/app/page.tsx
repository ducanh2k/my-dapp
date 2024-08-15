"use client";
import React, { useState } from "react";
import { ethers } from "ethers";
import { Button, message } from "antd";

const tokenAddress = "0x7A33e105B4C3f8Fd7275AA70C6eeB3B98b88789A";
const vaultAddress = "0x4978605A46C2f89CFa44643639684d81A11f8dc8";
const NFTAddress = "0xa6e5FA81500ffb975B32f2dF7d271b634CC4d135";
const MetaMaskAddress = "0xCA915780d6d9b48bC2803E4a7AB983779e65F128";
const tokenAbi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function mintToken(address _to,uint256 _amount) public",
  "function balanceOf(address account) external view returns (uint256)",
];

const vaultAbi = [
  "function deposit(uint256 amount) external",
  "function deposits(address account) external view returns (uint256)",
];

const NFTAbi = [
  "function tokenCounter() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

const Home: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [depositedBalance, setDepositedBalance] = useState<string>("0");
  const [tokenCounter, setTokenCounter] = useState<string>("0");

  const connectMetaMask = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      try {
        await newProvider.send("eth_requestAccounts", []);
        const signer = await newProvider.getSigner();
        const accountAddress = await signer.getAddress();
        setProvider(newProvider);
        setAccount(accountAddress);
        fetchBalances(newProvider, accountAddress);
        getNFTCounter(newProvider);
      } catch (error) {
        console.error("User rejected the request.", error);
        message.error("User rejected the request.");
      }
    } else {
      console.log("MetaMask is not installed");
      message.error("MetaMask is not installed");
    }
  };

  const fetchBalances = async (
    provider: ethers.BrowserProvider,
    account: string
  ) => {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        tokenAbi,
        provider
      );
      const vaultContract = new ethers.Contract(
        vaultAddress,
        vaultAbi,
        provider
      );

      const tokenBalance = await tokenContract.balanceOf(account);
      const depositedBalance = await vaultContract.deposits(account);

      setTokenBalance(ethers.formatUnits(tokenBalance, 18));
      setDepositedBalance(ethers.formatUnits(depositedBalance, 18));
    } catch (error) {
      console.error("Failed to fetch balances", error);
      message.error("Failed to fetch balances");
    }
  };

  const mintTokens = async () => {
    if (!provider || !account) return;

    try {
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      const tx = await tokenContract.mintToken(
        account,
        ethers.parseUnits("10000", 18)
      );
      await tx.wait();
      fetchBalances(provider, account);
      message.success("Minted 10000 tokens successfully!");
    } catch (error) {
      console.error("Minting tokens failed", error);
      message.error("Minting tokens failed");
    }
  };

  const depositTokens = async () => {
    if (!provider || !account) return;

    try {
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(vaultAddress, vaultAbi, signer);
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

      const approveTx = await tokenContract.approve(
        vaultAddress,
        ethers.parseUnits("10000", 18)
      );
      await approveTx.wait();

      const tx = await vaultContract.deposit(ethers.parseUnits("10000", 18));
      await tx.wait();

      fetchBalances(provider, account);
      message.success("Deposited 10000 tokens successfully!");
    } catch (error) {
      console.error("Depositing tokens failed", error);
      message.error("Depositing tokens failed");
    }
  };

  const getNFTCounter = async (provider: ethers.BrowserProvider) => {
    try {
      const NFTContract = new ethers.Contract(NFTAddress, NFTAbi, provider);
      // const count = await NFTContract.balanceOf(MetaMaskAddress);
      const count = await NFTContract.tokenCounter();
      setTokenCounter(count.toString());
    } catch (error) {
      console.log("Failed to fetch NFT Counter:", error);
      message.error("Failed to fetch NFT Counter");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>My DApp</h1>
      {account ? (
        <div>
          <p>Connected: {account}</p>
          <p>MyToken Balance: {tokenBalance}</p>
          <p>Deposited Balance: {depositedBalance}</p>
          <Button
            type="primary"
            onClick={mintTokens}
            style={{ marginTop: "10px" }}
          >
            Mint 10000 Tokens
          </Button>
          <Button
            type="default"
            onClick={depositTokens}
            style={{ marginTop: "10px", marginLeft: "10px" }}
          >
            Deposit 10000 Tokens
          </Button>
          <p>TokenERC721 Counter: {tokenCounter}</p>
        </div>
      ) : (
        <Button type="primary" onClick={connectMetaMask}>
          Connect MetaMask
        </Button>
      )}
    </div>
  );
};

export default Home;
