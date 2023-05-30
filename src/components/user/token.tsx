
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { useState } from 'react'
import { connectToGratieSolanaContract } from '@/src/gratie_solana_contract/gratie_solana_contract';
import { createCompanyRewardsBucket, CreateCompanyRewardsBucketForm, getCompanyRewardsBucketForCompany } from '@/src/gratie_solana_contract/gratie_solana_company';
import { useWallet } from '@solana/wallet-adapter-react';

import UploadFile from '@/src/components/uploadFileS3';
import {parseDataFromJsonUrl, uploadMetaDataToS3} from '@/src/utils/uploadMetaDataToS3';
import CardContent from '@mui/material/CardContent';
import { PRODUCTION } from '@/src/config';
import { addCompanyRewardTokensToMetaplex } from '@/src/gratie_solana_contract/gratie_solana_metaplex';
import Loading from '../Loading';
import ModalBox from '../Modal';

// import '@/styles/form.css';

interface Values {
  email: string;
  password: string;
}

declare const window: Window &
  typeof globalThis & {
    solana: any
  }

export default function CreateToken(props:any) {

  const wallet = useWallet();

  const [logoUrl, setLogoUrl] = React.useState('');

  const [rewardData, setRewardData] = React.useState({});

  const [formSubmitted, setFormSubmitted] = React.useState(false);

  const [formObject, setFormObject] = useState({
    name: "",
    symbol: "",
    description: "",
  });

  const [rewards, setRewards] = React.useState({});

  const [openMsg, setOpenMsg] = React.useState(false);
  const [openLoading, setOpenLoading] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalDesc, setModalDesc] = React.useState('');

  const handleModalClose = () => {
    setOpenMsg(false);
    setModalTitle('')
    setModalDesc('');
  }
  const handleLoaderToggle = (status:boolean) => {
    setOpenLoading(status)
  }


  React.useEffect(() => {
    if (props.reward && props.reward.tokenName && Object.keys(props.reward).length == 0) {
        handleLoaderToggle(true)
        parseDataFromJsonUrl(props.reward.tokenMetadataJsonUri).then((data) => {
        console.log('data', data);
        setRewardData(data)
        handleLoaderToggle(false)
    });  
    }
    if(formSubmitted){
      window.location.replace('/');
    }
  })

  const onValChange = (event: any) => {
    const value = (res: any) => ({
      ...res,
      [event.target.id]: event.target.value,
    });
    setFormObject(value);
  };

  const updateImageUrl = (url:string) =>{
    console.log("setLogoUrl", setLogoUrl);
    if(url && url!=''){
      setLogoUrl(url)
    }
  }

  const showContractInfo = async () => {
    if (props.contract && props.contract.token) {
      const jsonData = await parseDataFromJsonUrl(props.contract.token.tokenMetadataJsonUri);
      return (<div>{jsonData.name}<img src={jsonData.image}></img></div>)
    } else {
      return <div>No data</div>
    }
  }

   const getMetaJson = async (name:string, symbol:string, description:string) => {
      const jsonData =  {
        "name": name,
        "symbol": symbol,
        "description": description,
        "seller_fee_basis_points": 5,
        "external_url": "",
        "edition": "",
        "background_color": "000000",
        "image": logoUrl
      }
      const jsonUrl = await uploadMetaDataToS3(jsonData);
      return [jsonUrl, jsonData];
   }

   const createRewardToken = async (name:string, symbol:string, url:string) => {
    handleLoaderToggle(true)
    if (wallet) {
      console.log("wallet",wallet);
      const program = await connectToGratieSolanaContract();
      // const allLicenses = await program.account.companyLicense.all();
      console.log("program", program);
      const companyName = props.license.account.name
      try {
        const rewards: any = await getCompanyRewardsBucketForCompany(program, companyName)
        if (rewards) {
          confirm("already rewards present for the company");
          return;
        }
      } catch(err:any) {
        console.log("rewards", companyName, rewards);
      }
      try {
        const companyRewardsBucketForm: CreateCompanyRewardsBucketForm = {
            tokenName: name,
            tokenSymbol: symbol,
            tokenMetadataJsonUrl: url,
        };
        console.log("companyRewardsBucketForm", companyRewardsBucketForm);
        const companyRewards = await createCompanyRewardsBucket(program, (wallet as any).publicKey, companyName, companyRewardsBucketForm);
        setRewards(companyRewards);
        console.log("companyRewards created", companyRewards);

        // Adding company reward tokens to metaplex
        if (PRODUCTION) {
            await addCompanyRewardTokensToMetaplex(program, wallet.publicKey!, companyName);
        }
      }
      catch (err) {
        alert(err);
      }
    }
    else {
      confirm("Please connect to the wallet");
    }
    handleLoaderToggle(false)
  }


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("wallet",wallet);

    if(!props.license){
        alert('Please create company license before inviting user')
        return false;
      }

    if (logoUrl === '') {
      confirm("Please upload the logo before proceed");
      console.log("Please upload the logo before proceed");
      return false;
    }
    const data = new FormData(event.currentTarget);
    const formVal: any = new Object(formObject);
    
    if (formVal['name']=='' || formVal['email']=='' || formVal['tierID']=='' || formVal['evaluation']==''){
      confirm("Please enter all the form values");
      return false;
    }
    handleLoaderToggle(true)

    const [jsonMetadataUrl, jsonMetadata] = await getMetaJson(formVal.name, formVal.symbol, formVal.description);
    formVal['jsonMetadataUrl'] = jsonMetadataUrl;
    try {
      const reward = await createRewardToken(formVal.name, formVal.symbol, jsonMetadataUrl)
      console.log("reward",reward);
      setRewardData(jsonMetadata);
      setModalTitle('Created Reward for company, now you can invite users');
       setOpenMsg(true);
      // setFormSubmitted(true)
    }
    catch(err) {
      console.log("err",err);
      alert("Company should be unique, please add valid name and email");
    }
    
    handleLoaderToggle(false)
  };
  
    return (
        <React.Fragment>
        <Container sx={{ mt: 4}}>
            <Box className="form-box">
            <CardContent>
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 6 }} style={{ width: '928px', margin: '0px auto'}}>
            <Typography id="modal-modal-title" style={{ color: '#00FF01',fontWeight:'400', fontFamily:'Book Antiqua', marginBottom: '50px', fontSize: '28px',textAlign: 'center' }} variant="h6" component="h6">
            Available supply : #value
          </Typography>
            <Grid container spacing={1} sx={{ mt: 5, mb: 5 }} style={{justifyContent: 'center', margin: '30px 0px', alignItems: 'center'}}>
                <Grid item xs={12} md={4}>
                <Typography
                  noWrap
                  variant="h6" style={{ textAlign: 'start'}}
                  className='form-label'>
                  Distribution Percentage
                </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  id="name"
                  type='text'
                  autoComplete='off'
                  required
                  onChange={onValChange}
                  value={formObject.name}
                  className='form-textfield'
                  focused sx={{ input: {color:'#fff', fontSize:'20px'}}}
                />
                </Grid>
                <Grid item xs={12} md={3}>
                <Typography
                  noWrap
                  variant="h6" style={{ color: 'rgba(245, 245, 245, 0.5)', textAlign: 'start', marginLeft: '20px' }}
                  className='form-label'>
                  #value 
                </Typography>
                </Grid>
            </Grid>
    
            <Grid container spacing={1} sx={{mb: 5 }}  style={{justifyContent: 'center', margin: '30px 0px', alignItems: 'center' }}>
            <Grid item xs={12} md={4}>
                <Typography
                  noWrap
                  variant="h6" style={{ textAlign: 'start'}}
                  className='form-label'>
                  Existing Users
                </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                <Typography
                  noWrap
                  variant="h6" style={{ textAlign: 'start'}}
                  className='form-label'>
                  #Nos
                </Typography>
                </Grid>
                <Grid item xs={12} md={3}>

            </Grid>
            </Grid>
            <Grid container spacing={1} sx={{mb: 5 }}  style={{justifyContent: 'end', margin: '30px 0px' }}>
            <Grid item xs={12} md={5}>
              <Button type="submit" variant='contained' className='create-token-btn' style={{margin: '0px 30px 0px 0px' }}>Generate Rewards</Button>
            </Grid>
            </Grid>
            
            
          </Box>
        </CardContent>
        {rewardData && props.license && 
            <div style={{display: 'flex', justifyContent: 'center'}}><Typography
            noWrap
            variant="h6"
            sx={{color: '#fff'}}
            >
            Total Tokens generated : 
          </Typography>
          <Typography
          noWrap
          variant="h6"
          sx={{color: '#fff'}}
          className='profile-label'>
          {props.license.account.evaluation.toNumber()}
        </Typography></div>
            }
        </Box>
        
        </Container>
        <Loading open={openLoading} handleClose={handleLoaderToggle} />
        <ModalBox open={openMsg} handleClose={handleModalClose} heading={modalTitle} description={modalDesc}/>
        </React.Fragment>
      )
}