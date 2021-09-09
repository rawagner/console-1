/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { RouteComponentProps, useHistory } from 'react-router'
import { useRecoilValue, waitForAll } from 'recoil'
import { patchResource } from '@open-cluster-management/resources'
import {
    agentClusterInstallsState,
    agentsState,
    clusterDeploymentsState,
    clusterImageSetsState,
    infraEnvironmentsState,
} from '../../../../../../atoms'
import { getNetworkingPatches } from './utils'

const {
    ClusterDeploymentWizard,
    EditAgentModal,
    getAnnotationsFromAgentSelector,
} = CIM

type EditAIClusterProps = RouteComponentProps<{ namespace: string; name: string }>

const EditAICluster: React.FC<EditAIClusterProps> = ({
    match: {
        params: { namespace, name },
    },
}) => {
    const history = useHistory()
    const [editAgent, setEditAgent] = useState<CIM.AgentK8sResource | undefined>()
    const [clusterImageSets, clusterDeployments, agentClusterInstalls, agents] = useRecoilValue(
        waitForAll([
            clusterImageSetsState,
            clusterDeploymentsState,
            agentClusterInstallsState,
            agentsState,
            infraEnvironmentsState,
        ])
    )

    const clusterDeployment = clusterDeployments.find(
        (cd) => cd.metadata.name === name && cd.metadata.namespace === namespace
    )
    const agentClusterInstall = agentClusterInstalls.find(
        (aci) => aci.metadata.name === name && aci.metadata.namespace === namespace
    )

    const onSaveDetails = (values: any) => {
        return patchResource(agentClusterInstall, [
            {
                op: 'replace',
                path: '/spec/imageSetRef/name',
                value: values.openshiftVersion,
            },
        ]).promise
    }

    const onSaveHostsSelection = async (values: CIM.ClusterDeploymentHostsSelectionValues) => {
        const hostIds = values.autoSelectHosts ? values.autoSelectedHostIds : values.selectedHostIds
        const releasedAgents = agents.filter(
            (a) =>
                !hostIds.includes(a.metadata.uid) &&
                a.spec?.clusterDeploymentName?.name === name &&
                a.spec?.clusterDeploymentName?.namespace === namespace
        )

        await Promise.all(
            releasedAgents.map((agent) => {
                return patchResource(agent, [
                    {
                        op: 'replace',
                        path: '/spec/clusterDeploymentName',
                        value: {}, // means: delete; requires https://issues.redhat.com/browse/MGMT-7726
                    },
                ]).promise
            })
        )

        const addAgents = agents.filter(
            (a) =>
                hostIds.includes(a.metadata.uid) &&
                (a.spec?.clusterDeploymentName?.name !== name || a.spec?.clusterDeploymentName?.namespace !== namespace)
        )
        await Promise.all(
            addAgents.map((agent) => {
                return patchResource(agent, [
                    {
                        op: agent.spec?.clusterDeploymentName ? 'replace' : 'add',
                        path: '/spec/clusterDeploymentName',
                        value: {
                            name,
                            namespace,
                        },
                    },
                ]).promise
            })
        )

        if (clusterDeployment) {
            await patchResource(clusterDeployment, [
                {
                    op: clusterDeployment.metadata.annotations ? 'replace' : 'add',
                    path: '/metadata/annotations',
                    value: getAnnotationsFromAgentSelector(clusterDeployment, values),
                },
            ]).promise
        }
    }

    const onSaveNetworking = async (values: CIM.ClusterDeploymentNetworkingValues) => {
        try {
            const patches = getNetworkingPatches(agentClusterInstall, values)
            if (patches.length > 0) {
                await patchResource(agentClusterInstall, patches).promise
            }
        } catch (e) {
            throw Error(`Failed to patch the AgentClusterInstall resource: ${e.message}`)
        }
    }

    const hostActions = {
        canEditHost: () => true,
        onEditHost: (agent: CIM.AgentK8sResource) => {
            setEditAgent(agent)
        },
        canEditRole: () => true,
        onEditRole: (agent: CIM.AgentK8sResource, role: string | undefined) => {
            return patchResource(agent, [
                {
                    op: 'replace',
                    path: '/spec/role',
                    value: role,
                },
            ]).promise
        },
    }

    return (
        <>
            <ClusterDeploymentWizard
                className="cluster-deployment-wizard"
                clusterImages={clusterImageSets}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={agents}
                usedClusterNames={[/* Not needed for the Edit flow */]}
                onClose={history.goBack}
                onSaveDetails={onSaveDetails}
                onSaveNetworking={onSaveNetworking}
                onSaveHostsSelection={onSaveHostsSelection}
                hostActions={hostActions}
            />
            <EditAgentModal
                isOpen={!!editAgent}
                agent={editAgent}
                usedHostnames={[]}
                onClose={() => setEditAgent(undefined)}
                onSave={(agent, hostname) => {
                    return patchResource(agent, [
                        {
                            op: 'replace',
                            path: '/spec/hostname',
                            value: hostname,
                        },
                    ]).promise
                }}
                onFormSaveError={() => {}}
            />
        </>
    )
}

export default EditAICluster
