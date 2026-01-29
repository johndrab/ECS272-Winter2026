import Heatmap from './components/Heatmap'
import StarCoordinates from './components/StarCoordinates';
import Lineplot from './components/Lineplot'

import Notes from './components/Notes'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey, blue, indigo, brown } from '@mui/material/colors';


// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    background: {
      default: grey[100],   // page background
      paper: grey[200],     // cards / Paper components
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

// function Layout() {
//   return (
//     <Box
//       id="main-container"
//       sx={{ width: '100vw', height: '100vh' }}
//     >
//       <Grid
//         container
//         spacing={1}
//         sx={{ width: '100%', height: '100%' }}
//       >
//         {/* LEFT: Heatmap */}
//         <Grid
//           item
//           xs={6}
//           sx= {{ width: '55%', height: '55%' }}//{{ height: '100%' }}
//         >
//           <Example />
//         </Grid>

//         {/* RIGHT COLUMN */}
//         <Grid
//           item
//           xs={6}
//           sx={{ width: '40%', height: '95%' }}
//         >
//           <Grid
//             container
//             direction="column"
//             sx={{ height: '100%' }}
//           >
//             {/* Top-right: Star Coordinates */}
//             <Grid item sx={{width: '100%', height: '50%' }}>
//               <StarCoordinates />
//             </Grid>

//           </Grid>

          
//         </Grid>
//       </Grid>
//     </Box>
//   );
// }

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
        {/* ===== TOP HALF ===== */}
        <Grid
          container
          xs={12}
          sx={{ height: '50%' }}
          spacing={1}
        >
          {/* Top Left */}
          <Grid item xs={6} sx={{ width: '50vw', height: '53vh' }}>
            <Heatmap />
          </Grid>

          {/* Top Right */}
          <Grid item xs={6} sx={{ width: '48vw', height: '53vh' }}>
            <StarCoordinates />
          </Grid>
        </Grid>

        {/* ===== BOTTOM HALF ===== */}
        <Grid
          item
          xs={12}
          sx={{ width: '100vw', height: '41vh' }}
        >
          <Lineplot />
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
