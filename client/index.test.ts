import { test, expect } from "bun:test"

import { LiteSVM } from "litesvm";
import {
    PublicKey,
    Transaction,
    SystemProgram,
    Keypair,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
} from "@solana/web3.js";

test("one transfer", () => {
    const svm = new LiteSVM();
    const payer = new Keypair();
    const contractAddress = PublicKey.unique()
    svm.addProgramFromFile(contractAddress, './counter.so')
    svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
    const data_account = new Keypair();
    const blockhash = svm.latestBlockhash();

    const ix = [
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: data_account.publicKey,
            space: 4,
            lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
            programId: contractAddress
        })
    ]

    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = payer.publicKey
    tx.add(...ix)
    tx.sign(payer, data_account)
    svm.sendTransaction(tx);

    const balance = svm.getBalance(data_account.publicKey)
    expect(balance).toBe(svm.minimumBalanceForRentExemption(BigInt(4)))

    function doubleIt(){
        const ix2 = new TransactionInstruction({
            keys:[
                {pubkey:data_account.publicKey, isSigner:false, isWritable:true}
            ],
            programId:contractAddress,
            data:Buffer.from("")
        })

        const blockhash = svm.latestBlockhash()
        const tx2 = new Transaction()
        tx2.recentBlockhash = blockhash
        tx2.feePayer = payer.publicKey
        tx2.add(ix2)
        tx2.sign(payer)
        svm.sendTransaction(tx2)
        svm.expireBlockhash()
    }

    doubleIt()
    doubleIt()

    const newDataAccount = svm.getAccount(data_account.publicKey)
    console.log(newDataAccount)

    expect(newDataAccount?.data[0]).toBe(2)
});
