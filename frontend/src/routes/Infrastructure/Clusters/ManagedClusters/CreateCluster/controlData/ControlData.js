/* Copyright Contributors to the Open Cluster Management project */

import Handlebars from 'handlebars'
import installConfigHbs from '../templates/install-config.hbs'
import aiTemplateHbs from '../templates/assisted-installer/assisted-template.hbs'
import { AcmIconVariant, AcmIcon } from '@open-cluster-management/ui-components'

import controlDataAWS from './ControlDataAWS'
import controlDataGCP from './ControlDataGCP'
import controlDataAZR from './ControlDataAZR'
import controlDataVMW from './ControlDataVMW'
import controlDataBMC from './ControlDataBMC'
import controlDataOST from './ControlDataOST'
import { RedHatLogo, AwsLogo, GoogleLogo, AzureLogo, VMwareLogo, BaremetalLogo } from './Logos'
import controlDataAI from './ControlDataAI'

const installConfig = Handlebars.compile(installConfigHbs)

const aiTemplate = Handlebars.compile(aiTemplateHbs)

export const getActiveCardID = (control, fetchData = {}) => {
    const { requestedUIDs } = fetchData
    if (requestedUIDs && requestedUIDs.length) {
        return 'BMC'
    }
    return null
}

export const controlData = [
    ///////////////////////  container platform  /////////////////////////////////////
    {
        id: 'distStep',
        type: 'step',
        title: 'Infrastructure',
    },
    {
        id: 'chooseDist',
        type: 'title',
        info: 'creation.ocp.choose.distribution',
        tooltip: 'tooltip.creation.ocp.choose.distribution',
    },
    ///////////////////////  cloud  /////////////////////////////////////
    {
        id: 'infrastructure',
        type: 'cards',
        sort: false,
        pauseControlCreationHereUntilSelected: true,
        scrollViewAfterSelection: 300,
        available: [
            {
                id: 'AWS',
                logo: <AwsLogo />,
                title: 'cluster.create.aws.subtitle',
                change: {
                    insertControlData: controlDataAWS,
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers'
            },
            {
                id: 'GCP',
                logo: <GoogleLogo />,
                title: 'cluster.create.google.subtitle',
                change: {
                    insertControlData: controlDataGCP,
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers'
            },
            {
                id: 'Azure',
                logo: <AzureLogo />,
                title: 'cluster.create.azure.subtitle',
                change: {
                    insertControlData: controlDataAZR,
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers'
            },
            {
                id: 'vSphere',
                logo: <VMwareLogo />,
                title: 'cluster.create.vmware.subtitle',
                change: {
                    insertControlData: controlDataVMW,
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers'
            },
            {
                id: 'OpenStack',
                logo: <RedHatLogo />,
                title: 'cluster.create.redhat.subtitle',
                change: {
                    insertControlData: controlDataOST,
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers'
            },
            {
                id: 'BMC',
                logo: <BaremetalLogo />,
                title: 'cluster.create.baremetal.subtitle',
                change: {
                    insertControlData: controlDataBMC,
                    replacements: {
                        'install-config': { template: installConfig, encode: true, newTab: true },
                    },
                },
                section: 'Providers'
            },
            {
                id: 'AI',
                logo: <AcmIcon icon={AcmIconVariant.hybrid} />,
                title: 'cluster.create.ai.subtitle',
                change: {
                    insertControlData: controlDataAI,
                    replacements: {},
                    replaceTemplate: aiTemplate,
                },
                section: 'Centrally managed'
            },
        ],
        active: getActiveCardID,
    },
]
