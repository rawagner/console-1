import AIForm from '../components/AIForm';
import NetworkForm from '../components/NetworkForm';
import { automationControlData } from './ControlDataHelpers';

const controlDataAI = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  AI form  /////////////////////////////////////
    {
        id: 'aiDetailStep',
        type: 'step',
        title: 'Cluster details',
    },
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'ai',
        type: 'custom',
        component: <AIForm />,
        providerId: 'ai',
    },
    ...automationControlData,
    {
        id: 'aiNetworkStep',
        type: 'step',
        title: 'Cluster network',
        disableEditor: true,
    },
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'aiNetwork',
        type: 'custom',
        component: <NetworkForm />,
        providerId: 'aiNetwork',
    },
];

export default controlDataAI;
