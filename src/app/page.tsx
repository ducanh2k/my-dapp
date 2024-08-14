"use client";
import React, { useState } from "react";
import { ethers } from "ethers";
import { Button } from "antd";

const tokenAddress = "0x7A33e105B4C3f8Fd7275AA70C6eeB3B98b88789A";
const vaultAddress = "0x4978605A46C2f89CFa44643639684d81A11f8dc8";

const tokenAbi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function mintToken(address _to,uint256 _amount) public",
  "function balanceOf(address account) external view returns (uint256)",
  "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
];

const vaultAbi = [
  "function deposit(uint256 amount) external",
  "function deposits(address account) external view returns (uint256)",
];

const Home: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [depositedBalance, setDepositedBalance] = useState<string>("0");

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
      } catch (error) {
        console.error("User rejected the request.", error);
      }
    } else {
      console.log("MetaMask is not installed");
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
    } catch (error) {
      console.error("Minting tokens failed", error);
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
        ethers.parseUnits("10000", 18),
      );
      await approveTx.wait();

      const tx = await vaultContract.deposit(ethers.parseUnits("10000", 18));
      await tx.wait();

      fetchBalances(provider, account);
    } catch (error) {
      console.error("Depositing tokens failed", error);
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
