import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";
import { GratieSolana } from "../lib/types/gratie_solana";
import { getCompanyLicense, getCompanyLicensePDA, getCompanyRewardsBucketPDA, getGratieWalletPDA, getTierPDA } from "./pda";
import { createMintKeyAndTokenAccount } from "./util";


export const createCompanyRewardsBucket = async (program: anchor.Program<GratieSolana> | any, wallet: anchor.Wallet, company_name:string) => {
  const companyLicensePDA = getCompanyLicensePDA(program, company_name);
  const companyRewardsBucketPDA = getCompanyRewardsBucketPDA(program, companyLicensePDA);

  const { mintKey, tokenAccount } = await createMintKeyAndTokenAccount(program, wallet.publicKey);


  await program.methods.createCompanyRewardsBucket(company_name).accounts({
    mintAuthority: wallet.publicKey,
    companyLicense: companyLicensePDA,
    companyRewardsBucket: companyRewardsBucketPDA,
    mint: mintKey.publicKey,
    tokenAccount: tokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  }).rpc();

}


export const verifyCompanyLicense = async (program: anchor.Program<GratieSolana> | any, wallet: anchor.Wallet, company_name:string) => {
  const companyLicense = getCompanyLicensePDA(program, company_name);
  await program.methods.verifyCompanyLicense().accounts({ admin: wallet.publicKey, companyLicense: companyLicense }).rpc();


  const updatedLicense = await getCompanyLicense(program, company_name);
  expect(updatedLicense.verified).to.equal(true);
}

export const createCompanyLicense = async (program: anchor.Program<GratieSolana> | any, wallet: anchor.Wallet, company_name:string) => {
  const companyLicensePDA = getCompanyLicensePDA(program, company_name);

  const testEmail = "mail@mucks.dev";
  const testLogoUri = "https://v2.akord.com/public/vaults/active/G8DOVyi_zmdssZVa6NFY5K1gKIKVW9q7gyXGhVltbsI/gallery#public/74959dec-5113-4b8b-89a0-a1e56ce8d89e";
  const testEvaluation = new anchor.BN(100000);
  const tierID = 1;
  const tierPDA = getTierPDA(program, tierID);
  const tier = await program.account.tier.fetch(tierPDA);


  const { mintKey, tokenAccount } = await createMintKeyAndTokenAccount(program, wallet.publicKey);

  const gratieWalletBefore = await program.account.gratieWallet.fetch(getGratieWalletPDA(program));
  const oldAmountEarned = gratieWalletBefore.amountEarned.toNumber();


  await program.methods.createCompanyLicense(company_name, testEmail, testLogoUri, testEvaluation, tierID).accounts({
    mintAuthority: wallet.publicKey,
    companyLicense: companyLicensePDA,
    gratieWallet: getGratieWalletPDA(program),
    mint: mintKey.publicKey,
    tokenAccount: tokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    tier: tierPDA,
  }).rpc();

  const companyLicense = await getCompanyLicense(program, company_name);
  console.log(companyLicense);
  expect(companyLicense.name).to.equal(company_name);

  // check if the amountEarned increased by the price of the tier
  const gratieWallet = await program.account.gratieWallet.fetch(getGratieWalletPDA(program));
  const amountEarnedDiff = gratieWallet.amountEarned.toNumber() - oldAmountEarned;
  expect(amountEarnedDiff).to.equal(tier.priceLamports.toNumber());
}

