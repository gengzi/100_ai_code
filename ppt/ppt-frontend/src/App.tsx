import Presentation from './components/Presentation';
import { samplePresentation } from './data/presentation';
import './styles/presentation.css';

function App() {
  return <Presentation presentation={samplePresentation} />;
}

export default App;
