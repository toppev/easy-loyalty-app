import GrapesJS from 'grapesjs';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import grapesjsTabs from 'grapesjs-tabs';
import grapesjsTouch from 'grapesjs-touch';
import grapesjsTuiImageEditor from 'grapesjs-tui-image-editor';
import 'grapesjs/dist/css/grapes.min.css';
import React, { useEffect } from "react";
import { addPlaceholderBlock, registerListener } from "./blocks/placeholderBlock";
import { addCampaignsBlock } from "./blocks/campaignsBlock";
import { addUserRewardsBlock } from "./blocks/userRewardsBlock";
import Cookie from "js-cookie";
import { uploadHtmlCss } from "../../../services/pageService";
import { addRichTextEditorPlaceholders } from "./richPlaceholder";
import { usePlaceholderContext } from "./placeholderContext";
import { addQRCodeType } from "./blocks/qrCodeBlock";
import { addEnableNotificationsButton } from "./blocks/enableNotificationsBlock";
import { backendURL } from "../../../config/axios";
import { addProductsBlock } from "./blocks/productsBlock";
import { addUserQRBlock } from "./blocks/userQRCode";
import { addRewardQRBlock } from "./blocks/rewardQRCode";
import { addUserFormBlock } from "./blocks/userFormBlock";
import codeEditor from "./codeeditor/codeEditor";
import { addReferralButton } from "./blocks/referralButton";

// So the editor is not rendered every time if the page id didn't change
export default React.memo(GrapesPageEditor, propsAreEqual);

function propsAreEqual(prev, next) {
    return prev.page._id === next.page._id;
}

function GrapesPageEditor(props) {

    const url = `${backendURL}/page`;
    const placeholderContext = usePlaceholderContext()

    const uploadUrl = `https://api.getloyalty.app/content/upload`;

    useEffect(() => {
        const editor = GrapesJS.init({
            // Auto-saved on exit, see useEffect return cleanup function
            noticeOnUnload: false,
            container: `#page-editor`,
            canvas: {
                styles: ["./editorCanvas.css"]
            },
            plugins: [
                gjsBlocksBasic,
                grapesjsTabs,
                grapesjsTouch,
                grapesjsTuiImageEditor
            ],
            storageManager: {
                type: 'remote',
                // Doesn't work? FIXME?
                // stepsBeforeSave: 5,

                // Either save or create if undefined
                urlStore: `${url}/${props.page._id || ""}/?gjsOnly=true`,
                urlLoad: `${url}/${props.page._id}/?gjsOnly=true`,
            },
            assetManager: {
                upload: uploadUrl,
                multiUpload: false,
                // The server should respond with { data: ["https://...image.png] }
                autoAdd: true
            }
        });

        editor.on('storage:start', () => {
            const storage = editor.StorageManager.getCurrentStorage();
            storage.attributes.headers['XSRF-TOKEN'] = Cookie.get('XSRF-TOKEN')
        })

        editor.on('storage:start:store', () => {
            uploadHtmlCss(props.page, editor.getHtml(), editor.getCss())
                .then(() => props.setError())
                .catch(err => {
                    props.setError(err?.response?.message || `Oops... Something went wrong.
                    ${`Status code: ${err?.response?.status}` || err}.
                    This may be caused by invalid placeholders.`, editor.store)
                });
        });

        // Add custom blocks
        const bm = editor.BlockManager;
        registerListener(editor, props.selectPlaceholder);

        addRichTextEditorPlaceholders(editor, placeholderContext);

        addCampaignsBlock(bm);
        addProductsBlock(bm);
        addUserRewardsBlock(bm);

        addQRCodeType(editor);
        // addQRCodeBlock(bm);
        addUserQRBlock(bm);
        addRewardQRBlock(bm);

        addPlaceholderBlock(bm);
        addEnableNotificationsButton(bm);
        addReferralButton(bm)

        addUserFormBlock(bm);

        codeEditor(editor);

        const saveIfNeeded = () => {
            if (editor.getDirtyCount()) {
                editor.store()
            }
        }

        /* Currently disabled because editor#getDirtyCount does not reset for some reason

        let timeout = setTimeout(autosave, 10000);

        // Auto-save every 5 seconds
        function autosave() {
            saveIfNeeded()
            timeout = setTimeout(autosave, 5000);
        }
        */

        // Save when closing
        return function () {
            // clearInterval(timeout);
            saveIfNeeded();
        }
    });

    return (
        <div>
            <div id="page-editor"/>
        </div>
    )
}
