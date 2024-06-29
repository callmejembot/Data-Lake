const fs = require('fs');
const ac = require("@antiadmin/anticaptchaofficial");
const axios = require('axios');
const chalk = require('chalk');
const readline = require('readline');
const { ethers } = require('ethers');

const rpcUrl = 'https://rpc-mokotow.data-lake.co';
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

ac.setAPIKey('APIKEY_ANTI_CAPTCHA');

const enterprisePayload = null;
const isInvisible = false;
const isEnterprise = false;
const address = 'ADDRESS_CLAIM_FAUCET';

ac.setSoftId(0);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function readPrivateKeys() {
    const data = fs.readFileSync('privateKey.txt', 'utf8');
    return data.split('\n').filter(line => line.trim() !== '');
}

function showMenu() {
    console.log(chalk.blue('Please choose an option:'));
    console.log(chalk.green('1. Claim Faucet'));
    console.log(chalk.green('2. Daily TX'));
    rl.question(chalk.blue('Input your option: '), async (answer) => {
        if (answer === '1') {
            await claimFaucet();
        } else if (answer === '2') {
            await dailyTx();
        } else {
            console.log(chalk.red('Invalid option. Please choose 1 or 2.'));
        }
        rl.close();
    });
}

async function claimFaucet() {
    try {
        const gresponse = await ac.solveHCaptchaProxyless('https://faucet.data-lake.co', '5614258a-d342-42f0-9c24-822a9a3a800a', '', enterprisePayload, isInvisible, isEnterprise);
        console.log(chalk.blue('g-response: ') + gresponse);

        const payload = {
            addr: address,
            captchaToken: gresponse
        };

        const startSessionResponse = await axios.post('https://faucet.data-lake.co/api/startSession', payload);
        console.log(chalk.green('Session started successfully'));
        console.log(chalk.yellow('Status: ') + startSessionResponse.data.status);
        console.log(chalk.yellow('Target: ') + startSessionResponse.data.target);

        const sessionStatusResponse = await axios.get(`https://faucet.data-lake.co/api/getSessionStatus?session=${startSessionResponse.data.session}&details=1`);
        console.log(chalk.green('Session status retrieved'));
        console.log(chalk.yellow('Status: ') + sessionStatusResponse.data.status);
        console.log(chalk.yellow('Target: ') + sessionStatusResponse.data.target);

        const claimRewardResponse = await axios.post('https://faucet.data-lake.co/api/claimReward', { session: startSessionResponse.data.session });
        console.log(chalk.green('Reward claimed successfully'));
        console.log(chalk.yellow('Status: ') + claimRewardResponse.data.status);
        console.log(chalk.yellow('Target: ') + claimRewardResponse.data.target);
        console.log(chalk.yellow('Balance: ') + claimRewardResponse.data.balance);
        console.log(chalk.yellow('ClaimIdx: ') + claimRewardResponse.data.claimIdx);
        console.log(chalk.yellow('ClaimStatus: ') + claimRewardResponse.data.claimStatus);

    } catch (error) {
        console.error(chalk.red('Error occurred: '), error);
    }
}

async function dailyTx() {
    const privateKeys = await readPrivateKeys();
    for (const privateKey of privateKeys) {
        console.log(chalk.blue(`Processing transactions for private key: ${privateKey}`));
        for (let i = 0; i < 100; i++) {
            const newWallet = ethers.Wallet.createRandom();
            console.log(chalk.yellow(`Generated new wallet with address: ${newWallet.address}`));
            await sendmLAKEFromMainAccount(privateKey, newWallet.address, i + 1);
            await sleep(2000); // Wait 30 seconds before next transaction
        }
    }
}

async function sendmLAKEFromMainAccount(privateKey, toAddress, txCount) {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log(chalk.yellow(`Sending 1 mLAKE to ${toAddress}...`));

        const gasLimit = 10000000;
        const gasPrice = ethers.utils.parseUnits('100000000', 'wei');

        const tx = await wallet.sendTransaction({
            to: toAddress,
            value: ethers.utils.parseEther('1'),
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });

        console.log(chalk.green(`Transaction ${txCount} sent successfully: https://explorer.data-lake.co/tx/${tx.hash}`));
    } catch (error) {
        console.error(chalk.red('Error:', error));
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

showMenu();
