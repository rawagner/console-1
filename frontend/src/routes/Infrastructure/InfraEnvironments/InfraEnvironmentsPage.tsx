/* Copyright Contributors to the Open Cluster Management project */
import isMatch from 'lodash/isMatch'
import {
    AcmButton,
    AcmEmptyState,
    AcmInlineStatusGroup,
    AcmLabels,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmRoute,
    AcmTable,
 } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import { CIM } from 'openshift-assisted-ui-lib'

import { acmRouteState, agentsState, infraEnvironmentsState } from '../../../atoms'
import { NavigationPath } from '../../../NavigationPath'

const InfraEnvironmentsPage: React.FC = () => {
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.InfraEnvironments), [setRoute])

    const [infraEnvs, agents] = useRecoilValue(waitForAll([infraEnvironmentsState, agentsState]))
    const { t } = useTranslation(['infraenv', 'common'])

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('infraenv:infraenvs')}
                    titleTooltip={
                        <>
                            {t('infraenv:infraenvs.tooltip')}
                            <a
                                href="foo"
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('common:learn.more')}
                            </a>
                        </>
                    }
                />
            }
        >
            <AcmPageContent id="infra-environments">
                <PageSection>
                    <InfraEnvsTable infraEnvs={infraEnvs} agents={agents} />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

const keyFn = (infraEnv: CIM.InfraEnvK8sResource) => infraEnv.metadata.uid

type InfraEnvsTableProps = {
    infraEnvs: CIM.InfraEnvK8sResource[]
    agents: CIM.AgentK8sResource[]
}

const InfraEnvsTable: React.FC<InfraEnvsTableProps> = ({ infraEnvs, agents }) => {
    const { t } = useTranslation(['infraenv', 'common'])
    const history = useHistory()
    const getDetailsLink = (infraEnv: CIM.InfraEnvK8sResource) => NavigationPath.infraEnvironmentDetails
        .replace(':namespace', infraEnv.metadata.namespace as string)
        .replace(':name', infraEnv.metadata.name as string)

    return (
        <AcmTable<CIM.InfraEnvK8sResource>
            items={infraEnvs}
            rowActions={[]}
            keyFn={keyFn}
            plural="infra environments"
            columns={[
                {
                    header: t('infraEnv.tableHeader.name'),
                    sort: 'metadata.name',
                    search: 'metadata.name',
                    cell: (infraEnv) => (
                        <span style={{ whiteSpace: 'nowrap' }}>
                            <Link to={getDetailsLink(infraEnv)}>
                                {infraEnv.metadata.name}
                            </Link>
                        </span>
                    ),
                },
                {
                    header: t('infraEnv.tableHeader.namespace'),
                    cell: 'metadata.namespace',
                    search: 'metadata.namespace',
                },
                {
                    header: t('infraEnv.tableHeader.labels'),
                    cell: (infraEnv) => {
                        if (infraEnv.metadata.labels) {
                            const labelKeys = Object.keys(infraEnv.metadata.labels)
                            const collapse =
                                [
                                    'cloud',
                                    'clusterID',
                                    'installer.name',
                                    'installer.namespace',
                                    'name',
                                    'vendor',
                                    'managed-by',
                                    'local-cluster',
                                ].filter((label) => labelKeys.includes(label)) ?? []
                            return (
                                <AcmLabels
                                    labels={infraEnv.metadata.labels}
                                    style={{ maxWidth: '600px' }}
                                    expandedText={t('common:show.less')}
                                    collapsedText={t('common:show.more', { number: collapse.length })}
                                    collapse={collapse}
                                />
                            )
                        } else {
                            return '-'
                        }
                    },
                },
                {
                    header: t('infraEnv.tableHeader.location'),
                    cell: (infraEnv) => infraEnv.metadata?.labels?.['assisted-install-location'] ?? '-',
                },
                {
                    header: t('infraEnv.tableHeader.hosts'),
                    cell: (infraEnv) => {
                        const infraAgents = agents.filter(
                            (a) => isMatch(a.metadata.labels, infraEnv.status?.agentLabelSelector?.matchLabels),
                        )
                        return (
                            <Link to={`${getDetailsLink(infraEnv)}/hosts`}>
                                {infraAgents.length ? (
                                    <AcmInlineStatusGroup
                                        healthy={infraAgents.length}
                                        danger={0}
                                        unknown={0}
                                    />
                                ) : 0}
                            </Link>
                        );
                    },
                },
                /*
                {
                    header: '',
                    cell: (infraEnv) => {
                        return <InfraEnvActionDropdown infraEnv={infraEnv} />
                    },
                    cellTransforms: [fitContent],
                },
                */
            ]}
            tableActions={[
                {
                    id: 'createInfraEnv',
                    title: t('infraEnv.bulkAction.createInfraEnv'),
                    click: () => history.push(NavigationPath.createInfraEnv),
                },
            ]}
            emptyState={
                <AcmEmptyState
                    key="ieEmptyState"
                    title={t('infraEnv.emptyStateHeader')}
                    action={
                        <AcmButton
                            component={Link}
                            variant="primary"
                            to={NavigationPath.createInfraEnv}
                        >
                            {t('infraEnv.createCluster')}
                        </AcmButton>
                    }
                />
            }
        />
    );
}

export default InfraEnvironmentsPage
