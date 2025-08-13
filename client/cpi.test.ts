import { expect, test } from "bun:test"
import { Account, LiteSVM } from "litesvm"
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"

test("cpi works as expected", async () => {
    let svm = new LiteSVM();

    let doubleContract = PublicKey.unique()
    let cpiContract = PublicKey.unique()

    svm.addProgramFromFile(doubleContract, './counter.so')
    svm.addProgramFromFile(cpiContract, './cpi_program.so')

    let userAcc = new Keypair();
    let dataAcc = new Keypair();

    svm.airdrop(userAcc.publicKey, BigInt(2 * LAMPORTS_PER_SOL));

    createDataAccountOnChain(svm, dataAcc, userAcc, doubleContract)

    let ix = new TransactionInstruction({
        keys: [
            { pubkey: dataAcc.publicKey, isSigner: false, isWritable: true },
            { pubkey: doubleContract, isSigner: false, isWritable: false }
        ],
        programId: cpiContract,
        data: Buffer.from("")
    })

    const blockhash = svm.latestBlockhash()
    let transaction = new Transaction().add(ix)
    transaction.recentBlockhash = blockhash
    transaction.feePayer = userAcc.publicKey
    transaction.sign(userAcc, dataAcc)

    svm.sendTransaction(transaction)

    const dataAccountData = svm.getAccount(dataAcc.publicKey)
    expect(dataAccountData?.data[0]).toBe(1);
    expect(dataAccountData?.data[1]).toBe(0);
    expect(dataAccountData?.data[2]).toBe(0);
    expect(dataAccountData?.data[3]).toBe(0);

})

function createDataAccountOnChain(svm: LiteSVM, dataAcc: Keypair, payer: Keypair, contractPubkey: PublicKey) {
    const blockhash = svm.latestBlockhash();
    const ixs = [
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: dataAcc.publicKey,
            lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
            space: 4,
            programId: contractPubkey
        })
    ]
    const tx = new Transaction()
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;
    tx.add(...ixs);
    tx.sign(payer, dataAcc)
    svm.sendTransaction(tx)
}
