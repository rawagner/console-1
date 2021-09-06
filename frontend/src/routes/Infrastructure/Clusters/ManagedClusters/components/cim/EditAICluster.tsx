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

const { ClusterDeploymentWizard, EditAgentModal, RESERVED_AGENT_LABEL_KEY, getClusterDeploymentAgentReservedValue, getAnnotationsFromAgentSelector } = CIM

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

    return (
        <>
            <ClusterDeploymentWizard
                className="cluster-deployment-wizard"
                clusterImages={clusterImageSets}
                clusterDeployment={clusterDeployment}
                agentClusterInstall={agentClusterInstall}
                agents={agents}
                usedClusterNames={[]}
                onClose={history.goBack}
                onSaveDetails={onSaveDetails}
                onSaveNetworking={async (values) => {
                    try {
                        const patches = getNetworkingPatches(agentClusterInstall, values)
                        if (patches.length > 0) {
                            await patchResource(agentClusterInstall, patches).promise
                        }
                    } catch (e) {
                        throw Error(`Failed to patch the AgentClusterInstall resource: ${e.message}`)
                    }
                }}
                hostActions={{
                    canEditHost: () => true,
                    onEditHost: (agent) => {
                        setEditAgent(agent)
                    },
                    canEditRole: () => true,
                    onEditRole: (agent, role) => {
                        return patchResource(agent, [
                            {
                                op: 'replace',
                                path: '/spec/role',
                                value: role,
                            },
                        ]).promise
                    },
                }}
                onSaveHostsSelection={async (values) => {
                    const reservedAgentlabelValue = getClusterDeploymentAgentReservedValue(
                        clusterDeployment?.metadata?.namespace || '',
                        clusterDeployment?.metadata?.name || '',
                    )
                    const hostIds = values.autoSelectHosts ? values.autoSelectedHostIds : values.selectedHostIds;
                    const releasedAgents = agents.filter((a) =>
                        !(hostIds.includes(a.metadata.uid)) && (Object.hasOwnProperty.call(a.metadata.labels || {}, RESERVED_AGENT_LABEL_KEY) ? a.metadata.labels[RESERVED_AGENT_LABEL_KEY] === reservedAgentlabelValue : false)
                    )

                    // remove RESERVED_AGENT_LABEL_KEY label from releasedAgents
                    await Promise.all(
                        releasedAgents.map((agent) => {
                          const newLabels = { ...agent.metadata.labels };
                          delete newLabels[RESERVED_AGENT_LABEL_KEY];
                          return patchResource(agent, [
                            {
                              op: 'replace',
                              path: `/metadata/labels`,
                              value: newLabels,
                            },
                            {
                              op: 'replace',
                              path: '/spec/clusterDeploymentName',
                              value: {}, // means: delete
                            },
                          ]).promise;
                        }),
                      );

                    const addAgents = agents.filter((a) =>
                        hostIds.includes(a.metadata.uid) && !Object.hasOwnProperty.call(a.metadata.labels, RESERVED_AGENT_LABEL_KEY)
                    )
                    await Promise.all(
                        addAgents
                          .map((agent) => {
                            const newLabels = {...(agent.metadata.labels || {})};
                            newLabels[RESERVED_AGENT_LABEL_KEY] = reservedAgentlabelValue;
                            return patchResource(agent, [
                              {
                                op: agent.metadata.labels ? 'replace' : 'add',
                                path: '/metadata/labels',
                                value: newLabels,
                              },
                              {
                                op: agent.spec?.clusterDeploymentName ? 'replace' : 'add',
                                path: '/spec/clusterDeploymentName',
                                value: {
                                  name: clusterDeployment?.metadata?.name || '',
                                  namespace: clusterDeployment?.metadata?.namespace || '',
                                },
                              },
                            ]).promise
                          })
                    );

                    if (clusterDeployment) {
                        await patchResource(clusterDeployment, [
                            {
                                op: clusterDeployment.metadata.annotations ? 'replace' : 'add',
                                path: '/metadata/annotations',
                                value: getAnnotationsFromAgentSelector(clusterDeployment, values),
                            },
                        ]).promise;
                    }
                }}
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
