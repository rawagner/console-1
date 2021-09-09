/* Copyright Contributors to the Open Cluster Management project */
import { AcmExpandableCard } from '@open-cluster-management/ui-components'
import { Stack, StackItem } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { useContext } from 'react'
import isMatch from 'lodash/isMatch'
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'
import { EventListFetchProps, FetchSecret } from 'openshift-assisted-ui-lib/dist/src/cim'
import { getResource, Secret, SecretApiVersion, SecretKind } from '@open-cluster-management/resources'

const {
    ClusterDeploymentProgress,
    getClusterStatus,
    ClusterInstallationError,
    AgentTable,
    shouldShowClusterInstallationProgress,
    shouldShowClusterCredentials,
    shouldShowClusterInstallationError,
    getConsoleUrl,
    ClusterDeploymentCredentials,
    ClusterDeploymentKubeconfigDownload,
    formatEventsData,
} = CIM

const fetchSecret: FetchSecret = (name, namespace) =>
    getResource<Secret>({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
            name,
            namespace,
        },
    }).promise

const AIClusterProgress: React.FC = () => {
    const { clusterDeployment, agentClusterInstall, agents } = useContext(ClusterContext)
    const infraAgents = agents
            ? agents.filter((a) => isMatch(a.metadata.labels, (clusterDeployment?.spec?.platform as any).agentBareMetal.agentSelector.matchLabels))
            : []

    // TODO(jtomasek): Figure out how to use this from ai-ui-lib (currently in ClusterDeploymentDetails which is not used by ACM)
    const handleFetchEvents: EventListFetchProps['onFetchEvents'] = async (_, onSuccess, onError) => {
        try {
            const eventsURL = agentClusterInstall.status?.debugInfo?.eventsURL
            if (!eventsURL) throw new Error('Events URL is not available.')

            const res = await fetch(eventsURL)
            const rawData: Record<string, string>[] = await res.json()
            const data = formatEventsData(rawData)

            onSuccess(data)
        } catch (e) {
            onError('Failed to fetch cluster events.')
        }
    }

    const [clusterStatus, clusterStatusInfo] = getClusterStatus(agentClusterInstall)
    return (
        <>
            {shouldShowClusterInstallationProgress(agentClusterInstall) && (
                <div style={{ marginBottom: '24px' }}>
                    <AcmExpandableCard title="Cluster installation progress" id="aiprogress">
                        {!!clusterDeployment && !!agentClusterInstall && (
                            <Stack hasGutter>
                                <StackItem>
                                    <ClusterDeploymentProgress
                                        clusterDeployment={clusterDeployment}
                                        agentClusterInstall={agentClusterInstall}
                                        agents={infraAgents}
                                        onFetchEvents={handleFetchEvents}
                                    />
                                </StackItem>
                                {shouldShowClusterCredentials(agentClusterInstall) && (
                                    <StackItem>
                                        <ClusterDeploymentCredentials
                                            clusterDeployment={clusterDeployment}
                                            agentClusterInstall={agentClusterInstall}
                                            agents={infraAgents}
                                            fetchSecret={fetchSecret}
                                            consoleUrl={getConsoleUrl(clusterDeployment)}
                                        />
                                    </StackItem>
                                )}
                                <StackItem>
                                    <ClusterDeploymentKubeconfigDownload
                                        clusterDeployment={clusterDeployment}
                                        agentClusterInstall={agentClusterInstall}
                                        fetchSecret={fetchSecret}
                                    />
                                </StackItem>
                                {shouldShowClusterInstallationError(agentClusterInstall) && (
                                    <StackItem>
                                        <ClusterInstallationError
                                            title={
                                                clusterStatus === 'cancelled'
                                                    ? 'Cluster installation was cancelled'
                                                    : undefined
                                            }
                                            statusInfo={clusterStatusInfo}
                                            logsUrl={agentClusterInstall.status?.debugInfo?.logsURL}
                                            openshiftVersion={clusterDeployment.status?.installVersion}
                                        />
                                    </StackItem>
                                )}
                            </Stack>
                        )}
                    </AcmExpandableCard>
                </div>
            )}
            <div style={{ marginBottom: '24px' }}>
                <AcmExpandableCard title="Cluster hosts" id="aihosts">
                    <AgentTable agents={infraAgents} className="agents-table" />
                </AcmExpandableCard>
            </div>
        </>
    )
}

export default AIClusterProgress
