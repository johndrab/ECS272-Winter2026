import Example from './components/Example'
import StarCoordinates from './components/StarCoordinates';
import Example12 from './components/Example12'

import Notes from './components/Notes'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';


// Adjust the color theme for material ui
const theme = createTheme({
  palette: {
    primary:{
      main: grey[700],
    },
    secondary:{
      main: grey[700],
    }
  },
})

// For how Grid works, refer to https://mui.com/material-ui/react-grid/

// function Layout() {
//   return (
//     <Box id='main-container'>
//       <Stack spacing={1} sx={{ height: '100%' }}>
//         {/* Top row: Example component taking about 60% width */}
//         <Grid container spacing={1} sx={{ height: '95%' }}>
//           <Grid size={7}>
//             <Example />
//           </Grid>
//           {/* flexible spacer to take remaining space */}
//           {/* <Grid size="grow" /> */}
//         </Grid>
//         {/* Bottom row: Notes component taking full width */}

//       </Stack>
//     </Box>
//   )
// }

function Layout() {
  return (
    <Box
      id="main-container"
      sx={{ width: '100vw', height: '100vh' }}
    >
      <Grid
        container
        spacing={1}
        sx={{ width: '100%', height: '100%' }}
      >
        {/* LEFT: Heatmap */}
        <Grid
          item
          xs={6}
          sx= {{ width: '55%', height: '95%' }}//{{ height: '100%' }}
        >
          <Example />
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid
          item
          xs={6}
          sx={{ width: '40%', height: '95%' }}
        >
          <Grid
            container
            direction="column"
            sx={{ height: '100%' }}
          >
            {/* Top-right: Star Coordinates */}
            <Grid item sx={{width: '100%', height: '50%' }}>
              <StarCoordinates />
            </Grid>

          </Grid>

          
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
