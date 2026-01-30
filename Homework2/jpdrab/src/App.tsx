// import Heatmap from './components/Heatmap';
// import StarCoordinates from './components/StarCoordinates';
// import Lineplot from './components/Lineplot';

// import Grid from '@mui/material/Grid';
// import Box from '@mui/material/Box';
// import { createTheme, ThemeProvider } from '@mui/material/styles';
// import { grey } from '@mui/material/colors';

// const theme = createTheme({
//   palette: {
//     background: {
//       default: grey[100],
//       paper: grey[200],
//     },
//     primary: {
//       main: grey[100],
//     },
//     secondary: {
//       main: grey[700],
//     },
//   },
// });

// function Layout() {
//   return (
//     <Box
//       id="main-container"
//       sx={{ width: '100vw', height: '100vh', bgcolor: 'primary.main', p: 1 }}
//     >
//       <Grid container spacing={1} sx={{ height: '100%' }}>
//         {/* LEFT HALF: Heatmap + Lineplot */}
//         <Grid
//           item
//           xs={12}  // full width on mobile
//           md={6}  // half width on desktop
//           container
//           spacing={1}
//           direction="column"
//         >
//           <Grid item xs={6}>
//             <Heatmap />
//           </Grid>
//           <Grid item xs={6}>
//             <Lineplot />
//           </Grid>
//         </Grid>

//         {/* RIGHT HALF: StarCoordinates */}
//         <Grid
//           item
//           xs={12} // full width on mobile
//           md={6}  // half width on desktop
//         >
//           <StarCoordinates />
//         </Grid>
//       </Grid>
//     </Box>
//   );
// }

// function App() {
//   return (
//     <ThemeProvider theme={theme}>
//       <Layout />
//     </ThemeProvider>
//   );
// }

// export default App;

import Heatmap from './components/Heatmap'
import StarCoordinates from './components/StarCoordinates';
import Lineplot from './components/Lineplot'

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey, blue, indigo, brown } from '@mui/material/colors';


// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    background: {
      default: grey[100],  
      paper: grey[200],     
    },
    primary:{
      main: grey[100],
    },
    secondary:{
      main: grey[700],
    }
  },
})

// For how Grid works, refer to https://mui.com/material-ui/react-grid/
function Layout() {
  return (
    <Box
      id="main-container"
      sx={{ width: '100vw', height: '100vh', bgcolor: 'primary.main',}}
    >
      <Grid
        container
        spacing={1}
        sx={{ width: '100%', height: '100%' }}
      >
        {/* TOP HALF  */}
        <Grid
          container
          xs={12}
          // sx={{ width: '100%', height: '50%' }}
          sx={{ width: '50%', height: '95%' }}
          spacing={1}
        >

          {/* Top Left */}
          <Grid item xs={6} 
              // sx={{ width: '55%', height: '100%' }}
              sx={{ width: '100%', height: '50%' }}
              > 
            <Heatmap />
          </Grid>

          {/* Top Right */}
          <Grid item xs={6} sx={{ width: '100%', height: '50%' }}>
            {/* <StarCoordinates /> */}
            <Lineplot />
          </Grid>
        </Grid>

        {/* BOTTOM HALF */}
        <Grid
          item
          xs={12}
          // sx={{ width: '100%', height: '40%' }}
          sx={{ width: '48%', height: '95%' }}
        >
          <StarCoordinates />
          {/* <Lineplot /> */}
        </Grid>
      </Grid>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  )
}

export default App



// //function Layout() {
// //  return (
// //    <Box
// //      id="main-container"
// //      sx={{
// //        width: '100%',
// //        minHeight: '100vh',
// //        bgcolor: 'primary.main',
// //        p: 1,
// //      }}
// //    >
// //      <Grid container spacing={2}>
// //
// //        {/* Heatmap */}
// //        <Grid item xs={12} md={6}>
// //          <Box sx={{ height: { xs: 400, md: 500 } }}>
// //            <Heatmap />
// //          </Box>
// //        </Grid>
// //
// //        {/* Star Coordinates */}
// //        <Grid item xs={12} md={6}>
// //          <Box sx={{ height: { xs: 400, md: 500 } }}>
// //            <StarCoordinates />
// //          </Box>
// //        </Grid>
// //
// //        {/* Line Plot */}
// //        <Grid item xs={12}>
// //          <Box sx={{ height: { xs: 350, md: 450 } }}>
// //            <Lineplot />
// //          </Box>
// //        </Grid>
// //
// //      </Grid>
// //    </Box>
// //  );
// //}


