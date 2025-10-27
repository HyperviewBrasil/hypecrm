import React from 'react';
import { Contract } from '../../../types';
import ProposalPDFLayout from '../Proposals/ProposalPDFLayout'; 
import { FiCheckCircle } from 'react-icons/fi';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};
const formatFullDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    });
};

const Clause: React.FC<{ number: string; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="mb-4 break-inside-avoid">
        <h2 className="text-sm font-bold uppercase mb-2">CLÁUSULA {number} – {title}</h2>
        <div className="text-xs space-y-2 text-justify leading-relaxed">{children}</div>
    </div>
);

const SubClause: React.FC<{ number: string; children: React.ReactNode }> = ({ number, children }) => (
    <p><strong className="font-semibold">{number}</strong> {children}</p>
);

const StampSVG: React.FC<{ hash: string }> = ({ hash }) => (
    <svg width="180" height="80" viewBox="0 0 180 80" className="absolute left-1/2 -translate-x-1/2 top-[55px] transform -rotate-12 opacity-90">
        <defs>
            <filter id="texture" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="turbulence" />
                <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
        </defs>
        <rect x="2" y="2" width="176" height="76" rx="8" 
              className="fill-transparent stroke-green-600" 
              strokeWidth="3" 
              filter="url(#texture)" />
        <g className="text-green-700 font-sans select-none" style={{ filter: 'url(#texture)' }}>
            <text x="50%" y="30" dominantBaseline="middle" textAnchor="middle" className="font-bold text-[13px] uppercase tracking-wider flex items-center">
                 <FiCheckCircle className="inline h-3 w-3 mr-1" /> ASSINADO DIGITALMENTE
            </text>
            <text x="50%" y="55" dominantBaseline="middle" textAnchor="middle" className="font-mono text-base tracking-widest">{hash}</text>
        </g>
    </svg>
);


const ContractPDFLayout: React.FC<{ contract: Contract }> = ({ contract }) => {
    const client = contract.proposals?.empresas_unidades;
    const proposal = contract.proposals;
    const signatureHash = React.useMemo(() => Math.random().toString(16).substring(2, 9).toUpperCase(), []);

    if (!proposal || !client) {
        return <div className="p-8">Dados do contrato ou proposta ausentes.</div>;
    }

    return (
        <div className="bg-white text-[#333] font-sans">
            {/* --- INÍCIO DO CONTRATO --- */}
            <div className="min-h-[25cm] px-1 print:p-0"> {/* Content area */}
                <header className="text-center mb-10">
                    <h1 className="text-lg font-bold">INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO E PRESTAÇÃO DE SERVIÇOS</h1>
                    <p className="text-base font-semibold mt-1">Nº {contract.contract_code}</p>
                    {contract.purchase_order && <p className="text-sm mt-1">ORDEM DE COMPRA (O.C.): {contract.purchase_order}</p>}
                </header>

                <section className="mb-6 text-xs leading-relaxed">
                    <h2 className="text-sm font-bold uppercase mb-3">PARTES CONTRATANTES</h2>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <p><strong className="font-bold">CONTRATADA:</strong> HYPERVIEW MARKETING E EVENTOS, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 49.904.720/0001-70, com sede na Rua Silva Bueno, 1177, Ipiranga, São Paulo/SP, CEP 04208-051.</p>
                        </div>
                        <div className="space-y-1">
                            <p><strong className="font-bold">CONTRATANTE:</strong> {client.razao_social}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {client.cnpj_unidade}, com sede em {`${client.endereco_logradouro}, ${client.endereco_numero} - ${client.endereco_bairro}, ${client.endereco_cidade}/${client.endereco_estado}`}, neste ato representada por {contract.signatory_name}, CPF nº {contract.signatory_cpf}.</p>
                        </div>
                    </div>
                </section>
                
                <p className="text-xs text-justify my-6 leading-relaxed">
                    As partes acima qualificadas, doravante designadas simplesmente CONTRATADA e CONTRATANTE, têm entre si justo e acordado o presente Contrato, que se regerá pelas cláusulas e condições a seguir:
                </p>
                
                <div className="space-y-4">
                     <Clause number="1ª" title="OBJETO">
                        <SubClause number="1.1.">O presente Contrato visa estabelecer os termos e condições gerais aplicáveis à **locação de equipamentos eletrônicos e prestação de serviços** pela CONTRATADA ao CONTRATANTE.</SubClause>
                        <SubClause number="1.2.">O escopo, as responsabilidades, as obrigações e as condições específicas dos serviços estão detalhados na **Proposta Comercial nº {proposal.proposal_code}**, a qual passa a ser parte integrante deste instrumento.</SubClause>
                        <SubClause number="1.3.">Serviços adicionais não especificados na proposta comercial serão cobrados à parte, mediante apresentação de proposta complementar.</SubClause>
                        <SubClause number="1.4.">Qualquer alteração de escopo que impacte prazo, preço ou obrigações deverá ser formalizada por meio de **aditivo contratual**.</SubClause>
                        <SubClause number="1.5.">A **Proposta Comercial nº {proposal.proposal_code}**, contendo o detalhamento técnico e operacional dos serviços, fica anexada a este contrato como **Anexo I**, passando a integrar o presente instrumento para todos os fins de direito.</SubClause>
                    </Clause>

                    <Clause number="2ª" title="VALOR E PAGAMENTO">
                        <SubClause number="2.1.">Pelos serviços contratados, o CONTRATANTE pagará à CONTRATADA o valor total de **{formatCurrency(contract.contract_value)}**.</SubClause>
                        <SubClause number="2.2.">O pagamento deverá ser efetuado de acordo com as instruções da **Fatura** emitida pela CONTRATADA.</SubClause>
                        <SubClause number="2.3.">Salvo disposição contrária na Fatura, os pagamentos serão realizados **à vista mediante transferência bancária (PIX ou TED)** para a conta de titularidade da CONTRATADA.</SubClause>
                        <SubClause number="2.4.">Em caso de atraso no pagamento, incidirá **multa de 2%** sobre o valor devido, acrescida de **juros de mora de 1% ao mês**, pro rata die, e **correção monetária pelo IGP-M**. A CONTRATADA notificará o CONTRATANTE por e-mail cadastrado, conferindo-lhe prazo de 5 (cinco) dias úteis para regularização antes da aplicação das penalidades.</SubClause>
                        <SubClause number="2.5.">Em caso de cobrança judicial, as partes reconhecem que os **honorários advocatícios** serão fixados nos termos do art. 85 do Código de Processo Civil.</SubClause>
                        <SubClause number="2.6.">Os tributos e encargos fiscais devidos em virtude deste Contrato estão inclusos no preço e serão de responsabilidade do contribuinte, conforme legislação aplicável.</SubClause>
                    </Clause>

                    <Clause number="3ª" title="PRAZO">
                       <SubClause number="3.1.">Este Contrato vigerá pelo período de **{formatDate(proposal.start_date)} a {formatDate(proposal.end_date)}**.</SubClause>
                       <SubClause number="3.2.">Alterações no prazo de vigência deverão ser formalizadas por e-mail ou aditivo contratual.</SubClause>
                       <SubClause number="3.3.">O contrato poderá ser renovado mediante manifestação expressa das partes, enviada por e-mail com antecedência mínima de **15 (quinze) dias** do término da vigência.</SubClause>
                    </Clause>

                    <Clause number="4ª" title="SINAL, PAGAMENTO E CANCELAMENTO">
                        <SubClause number="4.1.">Para garantia da reserva da data de locação e início da execução dos serviços, o CONTRATANTE pagará à CONTRATADA, no ato da assinatura deste contrato, um **sinal correspondente a 50% (cinquenta por cento)** do valor total contratado, a título de adiantamento e bloqueio de agenda. O sinal ora pactuado possui natureza de **arras confirmatórias** nos termos do art. 418 do Código Civil e também de **cláusula penal compensatória** em caso de cancelamento injustificado.</SubClause>
                        <SubClause number="4.2.">O valor remanescente, equivalente aos **50% (cinquenta por cento)** restantes, deverá ser quitado até **48 (quarenta e oito) horas antes do início do evento**, mediante transferência bancária, PIX ou outro meio acordado entre as partes.</SubClause>
                        <SubClause number="4.3.">Em caso de cancelamento por iniciativa do CONTRATANTE, aplicar-se-á a seguinte política de retenção sobre o valor do sinal pago:
                            <ul className="list-none pl-4 mt-1 text-xs space-y-1">
                                <li>**a)** Cancelamento formalizado com antecedência superior a **30 (trinta) dias** do início da locação: **devolução integral (100%)** do valor do sinal pago;</li>
                                <li>**b)** Cancelamento formalizado entre **30 (trinta) e 15 (quinze) dias** antes do início da locação: **retenção de 50%** (cinquenta por cento) do valor do sinal pago, devolvendo-se os 50% (cinquenta por cento) remanescentes;</li>
                                <li>**c)** Cancelamento formalizado entre **15 (quinze) e 7 (sete) dias** antes do início da locação: **retenção de 75%** (setenta e cinco por cento) do valor do sinal pago, devolvendo-se os 25% (vinte e cinco por cento) remanescentes;</li>
                                <li>**d)** Cancelamento formalizado com menos de **7 (sete) dias** de antecedência do início da locação: **retenção integral (100%)** do valor do sinal pago, sem direito a devolução.</li>
                            </ul>
                        </SubClause>
                        <SubClause number="4.4.">Caso o CONTRATANTE já tenha efetuado o pagamento integral do contrato e venha a cancelar o evento dentro dos prazos acima, a política de retenção será aplicada proporcionalmente sobre o valor total pago.</SubClause>
                        <SubClause number="4.5.">Eventuais valores a serem restituídos pela CONTRATADA em razão do cancelamento serão devolvidos no prazo máximo de **10 (dez) dias úteis** contados da data de formalização do cancelamento.</SubClause>
                        <SubClause number="4.6.">A CONTRATADA poderá, a seu critério e mediante disponibilidade operacional, oferecer ao CONTRATANTE a **opção de reagendamento** do evento ou **utilização de crédito futuro equivalente** ao valor retido, a ser utilizado em até **6 (seis) meses** contados da data original da locação.</SubClause>
                        <SubClause number="4.7.">O cancelamento deverá ser formalizado por **e-mail** enviado ao endereço eletrônico da CONTRATADA, sendo considerada a data de recebimento como marco para aplicação dos percentuais acima.</SubClause>
                        <SubClause number="4.8.">As partes reconhecem que os percentuais de retenção ora estabelecidos representam **estimativa razoável e prévia dos prejuízos** que a CONTRATADA incorre em razão do bloqueio de agenda, custos de preparação, logística e perda de oportunidade, nos termos dos arts. 408 e seguintes do Código Civil.</SubClause>
                    </Clause>

                    <Clause number="5ª" title="CONDIÇÕES DE USO E RESPONSABILIDADE">
                        <SubClause number="5.1.">A CONTRATANTE compromete-se a zelar pelos equipamentos, devolvendo-os no mesmo estado de conservação em que foram recebidos.</SubClause>
                        <SubClause number="5.2.">O CONTRATANTE responderá apenas pelos danos diretos comprovadamente decorrentes de mau uso, mediante apresentação de **laudo técnico e nota fiscal** do reparo.</SubClause>
                        <SubClause number="5.3.">Em caso de dano irreparável ou extravio, a CONTRATANTE ressarcirá a CONTRATADA pelo **valor de mercado** de um equipamento novo, de mesma marca e especificações técnicas.</SubClause>
                    </Clause>
                    
                    <Clause number="6ª" title="OBRIGAÇÕES DA CONTRATANTE">
                        <SubClause number="6.1.">São obrigações da CONTRATANTE: Efetuar os pagamentos nos prazos estabelecidos; Comunicar irregularidades constatadas; Fornecer informações necessárias à execução dos serviços; Zelar pelos equipamentos locados.</SubClause>
                    </Clause>

                    <Clause number="7ª" title="OBRIGAÇÕES DA CONTRATADA">
                        <SubClause number="7.1.">São obrigações da CONTRATADA: Entregar os equipamentos em perfeito estado de funcionamento; Prestar os serviços conforme o escopo acordado; Observar as normas de confidencialidade sobre as informações da CONTRATANTE.</SubClause>
                    </Clause>
                    
                    <Clause number="8ª" title="DEVOLUÇÃO DOS EQUIPAMENTOS">
                        <SubClause number="8.1.">Ao término do contrato, a CONTRATANTE devolverá os equipamentos mediante os procedimentos fiscais e operacionais acordados.</SubClause>
                        <SubClause number="8.2.">A CONTRATANTE será responsável por despesas de reparo de danos que excedam o desgaste natural, verificados na vistoria de devolução.</SubClause>
                        <SubClause number="8.3.">A não devolução injustificada dos equipamentos poderá ensejar medidas judiciais cabíveis para **reintegração de posse e cobrança de perdas e danos**.</SubClause>
                    </Clause>
                    
                     <Clause number="9ª" title="DISPOSIÇÕES GERAIS">
                        <SubClause number="9.1.">Nenhuma das Partes poderá ceder ou transferir os direitos e obrigações deste Contrato sem a prévia anuência por escrito da outra Parte.</SubClause>
                        <SubClause number="9.2.">Qualquer alteração a este Contrato só será válida se feita por escrito e assinada por ambas as Partes.</SubClause>
                        <SubClause number="9.3.">A tolerância de uma das partes quanto ao descumprimento de qualquer obrigação não implicará novação ou renúncia de direitos.</SubClause>
                    </Clause>

                    <Clause number="10ª" title="LEI E FORO">
                        <SubClause number="10.1.">Este Contrato é regido pelas leis brasileiras. Fica eleito o foro da **comarca de domicílio da CONTRATANTE**, com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir quaisquer litígios oriundos do presente instrumento.</SubClause>
                    </Clause>

                </div>

                <div className="break-inside-avoid">
                    <p className="text-xs text-center my-8">E por estarem justas e acordadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.</p>
                    <p className="text-xs font-semibold text-center mb-12">{client.endereco_cidade}, {formatFullDate(contract.created_at)}.</p>

                    {/* Signature Section */}
                    <div className="grid grid-cols-2 gap-12 text-center text-xs">
                        {/* Contratada Signature */}
                        <div className="relative h-28">
                             <div className="absolute inset-x-0 -top-8 h-24">
                                <img
                                    src="https://hxgasuppbciqlytlebty.supabase.co/storage/v1/object/public/media/assinatura.png"
                                    alt="Assinatura Digital"
                                    className="h-24 object-contain mx-auto mix-blend-multiply"
                                />
                                <StampSVG hash={signatureHash} />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 border-t border-black pt-2">
                                <p className="font-bold">CONTRATADA</p>
                                <p>HYPERVIEW MARKETING E EVENTOS</p>
                                <p>CNPJ: 49.904.720/0001-70</p>
                            </div>
                        </div>
                        {/* Contratante Signature */}
                        <div className="relative h-28">
                           <div className="absolute inset-x-0 bottom-0 border-t border-black pt-2">
                                <p className="font-bold">CONTRATANTE</p>
                                <p>{client.razao_social}</p>
                                <p>Ass.: {contract.signatory_name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 text-center text-xs mt-12">
                        <div className="border-t border-black pt-2">
                            <p className="font-bold">Testemunha 1</p>
                             <p className="mt-2 text-gray-500">Nome:</p>
                            <p className="text-gray-500">CPF:</p>
                        </div>
                        <div className="border-t border-black pt-2">
                            <p className="font-bold">Testemunha 2</p>
                            <p className="mt-2 text-gray-500">Nome:</p>
                            <p className="text-gray-500">CPF:</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Annex I - Proposal */}
            <div className="break-before-page mt-12 pt-12 border-t-2 border-dashed border-gray-300 print:border-none print:mt-0 print:pt-0">
                <ProposalPDFLayout 
                    proposal={proposal} 
                    isAnnex={true} 
                    approvalTimestamp={contract.created_at} 
                />
            </div>
        </div>
    );
};

export default ContractPDFLayout;