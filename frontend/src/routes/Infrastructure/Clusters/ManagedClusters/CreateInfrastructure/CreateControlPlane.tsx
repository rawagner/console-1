/* Copyright Contributors to the Open Cluster Management project */
import { CheckIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import {
    CatalogCardItemType,
    ItemView,
    getPatternflyColor,
    ICatalogBreadcrumb,
    ICatalogCard,
    PageHeader,
    PatternFlyColor,
    CatalogColor,
} from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { customResourceDefinitionsState } from '../../../../../atoms'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { NavigationPath } from '../../../../../NavigationPath'

export function CreateControlPlane() {
    const [t] = useTranslation()
    const history = useHistory()
    const [crds] = useRecoilState(customResourceDefinitionsState)

    const isHypershiftEnabled = crds.some(({ metadata }) => metadata.name === 'hostedclusters.hypershift.openshift.io')

    const cards = useMemo(() => {
        const newCards: ICatalogCard[] = [
            {
                id: 'hosted',
                title: t('Hosted'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t(
                            'Run OpenShift in a hyperscale manner with many control planes hosted on a central hosting service cluster.'
                        ),
                    },
                    {
                        type: CatalogCardItemType.List,
                        title: t('Features'),
                        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
                        items: [
                            { text: t('Better hardware utilization') },
                            { text: t('Network and trusted segmentation between control plane and workers') },
                            { text: t('Rapid cluster creation') },
                        ],
                    },
                    {
                        type: CatalogCardItemType.List,
                        title: t('Available cluster types'),
                        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
                        items: [{ text: t('Hosted cluster') }],
                    },
                ],
                onClick: isHypershiftEnabled ? () => history.push(NavigationPath.createCluster) : undefined,
                alertTitle: isHypershiftEnabled
                    ? undefined
                    : t('Hosted control plane operator must be enabled in order to continue'),
                alertVariant: 'info',
                alertContent: (
                    <a href={DOC_LINKS.HYPERSHIFT_INTRO} target="_blank" rel="noopener noreferrer">
                        {t('View documentation')} <ExternalLinkAltIcon />
                    </a>
                ),
                badge: t('Tech preview'),
                badgeColor: CatalogColor.orange,
            },
            {
                id: 'standalone',
                title: t('Standalone'),
                items: [
                    {
                        type: CatalogCardItemType.Description,
                        description: t('Run an OpenShift cluster with dedicated control planes nodes.'),
                    },
                    {
                        type: CatalogCardItemType.List,
                        title: t('Features'),
                        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
                        items: [
                            { text: t('Increased resiliency with multiple masters') },
                            { text: t('Isolation of workload creates secure profile') },
                            { text: t('Dedicated control plane nodes') },
                        ],
                    },
                    {
                        type: CatalogCardItemType.List,
                        title: t('Available cluster types'),
                        icon: <CheckIcon color={getPatternflyColor(PatternFlyColor.Green)} />,
                        items: [{ text: t('ACM Hub') }, { text: t('Hosting service cluster') }],
                    },
                ],
                onClick: () => history.push(NavigationPath.createCluster),
            },
        ]
        return newCards
    }, [history, t, isHypershiftEnabled])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = useMemo(() => {
        const newBreadcrumbs: ICatalogBreadcrumb[] = [
            { label: t('Clusters'), to: NavigationPath.clusters },
            { label: t('Infrastructure'), to: NavigationPath.createInfrastructure },
            { label: t('Control Plane') },
        ]
        return newBreadcrumbs
    }, [t])

    return (
        <Fragment>
            <PageHeader
                title={t('Control Plane')}
                description={t('Next, select a control plane type for your on-premise machine.')}
                breadcrumbs={breadcrumbs}
            />
            <ItemView
                items={cards}
                itemKeyFn={keyFn}
                itemToCardFn={(card) => card}
                onBack={() => history.push(NavigationPath.createInfrastructure)}
                onCancel={() => history.push(NavigationPath.clusters)}
            />
        </Fragment>
    )
}
