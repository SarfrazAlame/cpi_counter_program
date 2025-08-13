use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint::{self, ProgramResult},
    instruction::{AccountMeta, Instruction},
    program::invoke,
    pubkey::Pubkey,
    entrypoint
};

entrypoint!(process_instruction);

pub fn process_instruction(
    publicKey: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let mut iter = accounts.iter();
    let data_accounts = next_account_info(&mut iter)?;
    let double_contract_address = next_account_info(&mut iter)?;

    let instruction = Instruction {
        program_id: *double_contract_address.key,
        accounts: vec![AccountMeta {
            is_signer: true,
            is_writable: true,
            pubkey: *data_accounts.key,
        }], 
        data: vec![],
    };

    invoke(&instruction, &[data_accounts.clone()])?;

    Ok(())
}
