const { promises: fs } = require('fs');
const core = require('@actions/core');
const axios = require('axios').default;

function getInputs() {
   return {
      mdFilePath: core.getInput('md_file_path'),
      confluenceContentId: core.getInput('confluence_content_id'),
      confluencePageTitle: core.getInput('confluence_page_title'),
      confluenceAuth: {
         username: core.getInput('confluence_username'),
         password: core.getInput('confluence_password')
      }
   };
}

function buildMarkdownHTML(markdownContent) {
   return `<ac:structured-macro ac:name="markdown" ac:schema-version="1" data-layout="default" ac:macro-id="0598ffb9-ba9b-4885-a02b-771d34cef270">
      <ac:plain-text-body>
         <![CDATA[ ${markdownContent} ]]>
      </ac:plain-text-body>
   </ac:structured-macro>`;   
}

async function main() {
   let inputs = getInputs();
   
   let confluenceGetUrl = `https://stroeerdigitalgroup.atlassian.net/wiki/rest/api/content?title=${inputs.confluencePageTitle}`;
   let confluencePutUrl = `https://stroeerdigitalgroup.atlassian.net/wiki/rest/api/content/${inputs.confluenceContentId}`;

   let mdFileContent = await fs.readFile(inputs.mdFilePath, { encoding: 'utf-8' });
   let confluenceData = await axios.get(confluenceGetUrl, { 
      auth: inputs.confluenceAuth 
   });

   axios.put(confluencePutUrl, {
      version: {
         number: ++confluenceData.data.version.number
      },
      title: inputs.confluencePageTitle,
      type: 'page',
      body: {
         storage: {
            value: buildMarkdownHTML(mdFileContent),
            representation: 'storage'
         }
     }
   }, { auth: inputs.confluenceAuth });
}

main().catch((err) => core.setFailed(err.message));
