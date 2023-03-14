
import * as React from 'react';
import { sha256 } from "@project-serum/anchor/dist/cjs/utils";


import Container from '@mui/material/Container';
import { Box, Button, CardContent, Grid, ListItem, TextField, Typography } from '@mui/material';

import { useState } from 'react'

import { connectToGratieSolanaContract } from '@/src/gratie_solana_contract/gratie_solana_contract';
import { getCompanyLicensePDA, getCompanyRewardsBucket } from '@/src/gratie_solana_contract/gratie_solana_pda';

import { listCompanyLicenses, getAllVerifiedLicenses, getAllPendingLicenses } from "@/src/gratie_solana_contract/gratie_solana_company";

import List from './list'
import Link from 'next/link';
import { createUser } from '@/src/gratie_solana_contract/gratie_solana_user';
import { faker } from '@faker-js/faker';
import { useWallet } from '@solana/wallet-adapter-react';


export default function CreateUsers(props:any) {
    const wallet = useWallet();

  const [open, setOpen] = React.useState(false);

  const [email, setEmail] = React.useState('');

  const [openAddUser, setOpenAddUser] = React.useState(false);

  const handleClick = async() => {
    console.log("wallet", wallet)
    if(!email){
      alert('Enter user email to add')
      return false;
    } 
    const userId = sha256.hash(email).substring(0, 16);
    const password = faker.internet.password()

    const program = await connectToGratieSolanaContract();
    if(wallet && wallet.publicKey){
      const companyName = props.license.account.name
      const user = await createUser(program, wallet.publicKey, companyName, {
        userId: userId,
        encryptedPassword: password,
        encryptedPasswordAlgorithm: 0,
        encryptedPasswordSalt: password,
      });
      console.log(user)
    } else {
      console.error("CAN'T RUN TESTS: No wallet connected");
    }
    
  }

    return (
        <Container sx={{ mt: 3}} className="create-user-container">
            <Box className="form-box">
            <CardContent>
          <form className='form'>
            <Grid container spacing={1} sx={{ mt: 5, mb: 5 }}>
                <Grid item xs={12} md={7}>
                <Typography
                  noWrap
                  variant="h6"
                  className='form-label'>
                  Service Provider Email Id
                </Typography>
                </Grid>
                <Grid item xs={12} md={5} className="user-grid">
                <TextField
                  fullWidth
                  type='text'
                  id="email"
                  autoComplete='off'
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  className='form-textfield'
                  focused sx={{ input: {color:'#fff', fontSize:'20px'}}}
                />
                </Grid>
            </Grid>
            <Button onClick={handleClick} variant='contained' className='create-token-btn' sx={{mt:2, mb:5}}>
                Invite User
            </Button>
          </form>
        </CardContent>
        </Box>
        </Container>
      )
}