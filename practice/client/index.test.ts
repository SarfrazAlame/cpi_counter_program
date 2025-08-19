import { expect, test } from "bun:test";
import { LiteSVM } from "litesvm";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"

test("double count", () => {
    const svm = new LiteSVM()
    const payer = new Keypair()
    const data_account = new Keypair()
    const program_address = PublicKey.unique()

    svm.addProgramFromFile(program_address, './counters.so');

    svm.airdrop(payer.publicKey, BigInt(3 * LAMPORTS_PER_SOL));
    const blockhash = svm.latestBlockhash();

    const ixs = [
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: data_account.publicKey,
            space: 4,
            lamports: LAMPORTS_PER_SOL,
            programId: program_address
        })
    ]

    const tx = new Transaction()
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;
    tx.add(...ixs)
    tx.sign(payer, data_account)
    svm.sendTransaction(tx);

    const balance = svm.getBalance(data_account.publicKey)

    expect(balance).toBe(BigInt(LAMPORTS_PER_SOL))

    function doubleIt() {
        const ix2 = new TransactionInstruction({
            keys: [
                { pubkey: data_account.publicKey, isSigner: false, isWritable: true },
            ],
            programId: program_address,
            data: Buffer.from("")
        })

        const blockhash = svm.latestBlockhash();
        const tx2 = new Transaction()
        tx2.recentBlockhash = blockhash
        tx2.feePayer = payer.publicKey;

        tx2.add(ix2)
        tx2.sign(payer)
        svm.sendTransaction(tx2)
        svm.expireBlockhash()
    }

    doubleIt()
    doubleIt()
    doubleIt()

    const newDataAccount = svm.getAccount(data_account.publicKey);

    expect(newDataAccount?.data[0]).toBe(4)
    expect(newDataAccount?.data[1]).toBe(0)
    expect(newDataAccount?.data[2]).toBe(0)
    expect(newDataAccount?.data[3]).toBe(0)
})

